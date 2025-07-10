// frontend/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Typography, Box, CircularProgress, Alert, Grid, Card, CardContent } from '@mui/material';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

function Dashboard() {
    const { authAxios } = useAuth();
    const [spendingData, setSpendingData] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [budgetAnalysis, setBudgetAnalysis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [
                    spendingRes,
                    monthlyRes,
                    budgetRes
                ] = await Promise.all([
                    authAxios.get('/analysis/spending_by_category/'),
                    authAxios.get('/analysis/monthly_summary/'),
                    authAxios.get('/analysis/budget_vs_actual/')
                ]);
                setSpendingData(spendingRes.data);
                setMonthlySummary(monthlyRes.data);
                setBudgetAnalysis(budgetRes.data);
            } catch (err) {
                setError('Failed to load dashboard data. ' + (err.response?.data?.detail || err.message));
                console.error("Dashboard data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authAxios]);

    const pieChartData = {
        labels: spendingData.map(item => item.category),
        datasets: [{
            data: spendingData.map(item => item.total_amount),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8A2BE2', '#7FFF00', '#D2691E', '#FF7F50'
            ],
            hoverBackgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8A2BE2', '#7FFF00', '#D2691E', '#FF7F50'
            ]
        }]
    };

    const barChartData = {
        labels: monthlySummary.map(item => item.period),
        datasets: [
            {
                label: 'Income',
                data: monthlySummary.map(item => item.income),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Expenses',
                data: monthlySummary.map(item => item.expense),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
            {
                label: 'Net Flow',
                data: monthlySummary.map(item => item.net),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            }
        ]
    };

    const budgetChartData = {
        labels: budgetAnalysis.map(item => item.category),
        datasets: [
            {
                label: 'Allocated',
                data: budgetAnalysis.map(item => item.allocated),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Spent',
                data: budgetAnalysis.map(item => item.spent),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
            {
                label: 'Remaining',
                data: budgetAnalysis.map(item => item.remaining),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            }
        ]
    };


    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Spending by Category */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Spending by Category</Typography>
                            {spendingData.length > 0 ? (
                                <Pie data={pieChartData} />
                            ) : (
                                <Typography>No expense data to display.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Monthly Summary */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Monthly Income vs. Expenses</Typography>
                            {monthlySummary.length > 0 ? (
                                <Bar data={barChartData} />
                            ) : (
                                <Typography>No monthly data to display.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Budget vs Actual Spending */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Budget vs. Actual Spending</Typography>
                            {budgetAnalysis.length > 0 ? (
                                <Bar data={budgetChartData} options={{ indexAxis: 'y' }} /> // Horizontal bars
                            ) : (
                                <Typography>No budget data to display.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Optional: Recent Transactions / Other quick stats */}
                {/* <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
              <Typography>Implement a table of recent transactions here.</Typography>
            </CardContent>
          </Card>
        </Grid> */}
            </Grid>
        </Container>
    );
}

export default Dashboard;
