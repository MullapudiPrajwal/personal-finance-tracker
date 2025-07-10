// frontend/src/pages/Budgets.js  similar to crud
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Container, Typography, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { format } from 'date-fns';

function Budgets() {
    const { authAxios } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [currentBudget, setCurrentBudget] = useState(null);
    const [formState, setFormState] = useState({
        category: '',
        amount_allocated: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'), // Default to next month
    });

    const fetchBudgetsAndCategories = async () => {
        try {
            setLoading(true);
            const [budgetsRes, categoriesRes] = await Promise.all([
                authAxios.get('/budgets/'),
                authAxios.get('/categories/')
            ]);
            setBudgets(budgetsRes.data);
            // Filter only expense categories for budgets
            setCategories(categoriesRes.data.filter(cat => cat.type === 'expense'));
        } catch (err) {
            setError('Failed to load data. ' + (err.response?.data?.detail || err.message));
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetsAndCategories();
    }, [authAxios]);

    const handleOpenDialog = (budget = null) => {
        setCurrentBudget(budget);
        if (budget) {
            setFormState({
                category: budget.category,
                amount_allocated: budget.amount_allocated,
                start_date: format(new Date(budget.start_date), 'yyyy-MM-dd'),
                end_date: format(new Date(budget.end_date), 'yyyy-MM-dd'),
            });
        } else {
            setFormState({
                category: '',
                amount_allocated: '',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentBudget(null);
        setError('');
    };

    const handleChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                ...formState,
                amount_allocated: parseFloat(formState.amount_allocated),
            };

            if (currentBudget) {
                await authAxios.put(`/budgets/${currentBudget.id}/`, payload);
            } else {
                await authAxios.post('/budgets/', payload);
            }
            await fetchBudgetsAndCategories();
            handleCloseDialog();
        } catch (err) {
            setError('Failed to save budget. ' + (err.response?.data?.detail || err.message || JSON.stringify(err.response?.data)));
            console.error("Save budget error:", err.response?.data || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            try {
                await authAxios.delete(`/budgets/${id}/`);
                await fetchBudgetsAndCategories();
            } catch (err) {
                setError('Failed to delete budget. ' + (err.response?.data?.detail || err.message));
                console.error("Delete budget error:", err);
            }
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error && !openDialog) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" component="h1">Budgets</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Create Budget
                </Button>
            </Box>

            {budgets.length === 0 && !loading && (
                <Alert severity="info">No budgets created yet. Click "Create Budget" to get started!</Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>Allocated Amount</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {budgets.map((budget) => (
                            <TableRow key={budget.id}>
                                <TableCell>{budget.category_name}</TableCell>
                                <TableCell>${parseFloat(budget.amount_allocated).toFixed(2)}</TableCell>
                                <TableCell>{format(new Date(budget.start_date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>{format(new Date(budget.end_date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleOpenDialog(budget)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(budget.id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Budget Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{currentBudget ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            select
                            margin="dense"
                            name="category"
                            label="Category (Expense)"
                            fullWidth
                            required
                            value={formState.category}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                            disabled={!categories.length}
                        >
                            {categories.length > 0 ? (
                                categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>No expense categories available. Add one in Categories section.</MenuItem>
                            )}
                        </TextField>
                        <TextField
                            margin="dense"
                            name="amount_allocated"
                            label="Allocated Amount"
                            type="number"
                            fullWidth
                            required
                            value={formState.amount_allocated}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            name="start_date"
                            label="Start Date"
                            type="date"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            value={formState.start_date}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            name="end_date"
                            label="End Date"
                            type="date"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            value={formState.end_date}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {currentBudget ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Budgets;