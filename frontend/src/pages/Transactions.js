// frontend/src/pages/Transactions.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Container, Typography, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { format } from 'date-fns';

function Transactions() {
    const { authAxios } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null); // For editing
    const [formState, setFormState] = useState({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
    });

    const fetchTransactionsAndCategories = async () => {
        try {
            setLoading(true);
            const [transactionsRes, categoriesRes] = await Promise.all([
                authAxios.get('/transactions/'),
                authAxios.get('/categories/')
            ]);
            setTransactions(transactionsRes.data);
            setCategories(categoriesRes.data);
        } catch (err) {
            setError('Failed to load data. ' + (err.response?.data?.detail || err.message));
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactionsAndCategories();
    }, [authAxios]);

    const handleOpenDialog = (transaction = null) => {
        setCurrentTransaction(transaction);
        if (transaction) {
            setFormState({
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category || '', // Set to empty string if null
                description: transaction.description || '',
                date: format(new Date(transaction.date), 'yyyy-MM-dd'),
            });
        } else {
            setFormState({
                amount: '',
                type: 'expense',
                category: '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd'),
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentTransaction(null);
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
                amount: parseFloat(formState.amount),
                category: formState.category || null, // Ensure null if category not selected
            };

            if (currentTransaction) {
                await authAxios.put(`/transactions/${currentTransaction.id}/`, payload);
            } else {
                await authAxios.post('/transactions/', payload);
            }
            await fetchTransactionsAndCategories(); // Refresh list
            handleCloseDialog();
        } catch (err) {
            setError('Failed to save transaction. ' + (err.response?.data?.detail || err.message || JSON.stringify(err.response?.data)));
            console.error("Save transaction error:", err.response?.data || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await authAxios.delete(`/transactions/${id}/`);
                await fetchTransactionsAndCategories(); // Refresh list
            } catch (err) {
                setError('Failed to delete transaction. ' + (err.response?.data?.detail || err.message));
                console.error("Delete transaction error:", err);
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

    if (error && !openDialog) { // Display error only if not in dialog context
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    // Filter categories based on selected transaction type
    const filteredCategories = categories.filter(cat => cat.type === formState.type);


    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" component="h1">Transactions</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Add Transaction
                </Button>
            </Box>

            {transactions.length === 0 && !loading && (
                <Alert severity="info">No transactions added yet. Click "Add Transaction" to get started!</Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>{transaction.type}</TableCell>
                                <TableCell>${parseFloat(transaction.amount).toFixed(2)}</TableCell>
                                <TableCell>{transaction.category_name || 'N/A'}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleOpenDialog(transaction)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(transaction.id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Transaction Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{currentTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="dense"
                            name="amount"
                            label="Amount"
                            type="number"
                            fullWidth
                            required
                            value={formState.amount}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            select
                            margin="dense"
                            name="type"
                            label="Type"
                            fullWidth
                            required
                            value={formState.type}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="income">Income</MenuItem>
                            <MenuItem value="expense">Expense</MenuItem>
                        </TextField>
                        <TextField
                            select
                            margin="dense"
                            name="category"
                            label="Category"
                            fullWidth
                            value={formState.category}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                            disabled={!filteredCategories.length}
                        >
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>No categories available for this type. Add one in Categories section.</MenuItem>
                            )}
                        </TextField>
                        <TextField
                            margin="dense"
                            name="description"
                            label="Description"
                            fullWidth
                            multiline
                            rows={2}
                            value={formState.description}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            name="date"
                            label="Date"
                            type="date"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            value={formState.date}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {currentTransaction ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Transactions;
