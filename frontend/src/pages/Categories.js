// frontend/src/pages/Categories.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Container, Typography, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

function Categories() {
    const { authAxios } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formState, setFormState] = useState({
        name: '',
        type: 'expense',
    });

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await authAxios.get('/categories/');
            setCategories(response.data);
        } catch (err) {
            setError('Failed to load categories. ' + (err.response?.data?.detail || err.message));
            console.error("Fetch categories error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [authAxios]);

    const handleOpenDialog = (category = null) => {
        setCurrentCategory(category);
        if (category) {
            setFormState({
                name: category.name,
                type: category.type,
            });
        } else {
            setFormState({
                name: '',
                type: 'expense',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentCategory(null);
        setError('');
    };

    const handleChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (currentCategory) {
                await authAxios.put(`/categories/${currentCategory.id}/`, formState);
            } else {
                await authAxios.post('/categories/', formState);
            }
            await fetchCategories();
            handleCloseDialog();
        } catch (err) {
            setError('Failed to save category. ' + (err.response?.data?.detail || err.message || JSON.stringify(err.response?.data)));
            console.error("Save category error:", err.response?.data || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await authAxios.delete(`/categories/${id}/`);
                await fetchCategories();
            } catch (err) {
                setError('Failed to delete category. ' + (err.response?.data?.detail || err.message));
                console.error("Delete category error:", err);
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
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" component="h1">Categories</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Add Category
                </Button>
            </Box>

            {categories.length === 0 && !loading && (
                <Alert severity="info">No categories added yet. Click "Add Category" to get started!</Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.type}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleOpenDialog(category)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(category.id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Category Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{currentCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="dense"
                            name="name"
                            label="Category Name"
                            fullWidth
                            required
                            value={formState.name}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            select
                            margin="dense"
                            name="type"
                            label="Category Type"
                            fullWidth
                            required
                            value={formState.type}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="income">Income</MenuItem>
                            <MenuItem value="expense">Expense</MenuItem>
                        </TextField>
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {currentCategory ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Categories;