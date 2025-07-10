// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) {
        return null; // Don't render navbar if not authenticated
    }

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Personal Finance Tracker
                </Typography>
                <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
                <Button color="inherit" component={Link} to="/transactions">Transactions</Button>
                <Button color="inherit" component={Link} to="/budgets">Budgets</Button>
                <Button color="inherit" component={Link} to="/categories">Categories</Button>
                <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;
