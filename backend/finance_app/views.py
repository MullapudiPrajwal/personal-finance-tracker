# backend/finance_app/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Category, Transaction, Budget
from .serializers import (
    UserSerializer, RegisterSerializer, CategorySerializer,
    TransactionSerializer, BudgetSerializer
)
import pandas as pd
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth, TruncWeek
from django.db.models import Sum

# --- Authentication Views ---
class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,) # Override default permission if needed

class RegisterView(viewsets.ViewSet):
    permission_classes = (AllowAny,) # Allow anyone to register
    def create(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- CRUD ViewSets ---
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --- Analysis Views (Pandas Integration) ---
class AnalysisViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def spending_by_category(self, request):
        user_transactions = Transaction.objects.filter(
            user=request.user,
            type='expense'
        ).select_related('category')

        if not user_transactions.exists():
            return Response({'message': 'No expense data available for analysis.'}, status=status.HTTP_200_OK)

        # Convert queryset to list of dicts for Pandas DataFrame
        data = list(user_transactions.values('amount', 'category__name'))
        df = pd.DataFrame(data)

        if df.empty:
            return Response({'message': 'No expense data available for analysis after DataFrame creation.'}, status=status.HTTP_200_OK)

        # Pandas analysis
        spending_data = df.groupby('category__name')['amount'].sum().reset_index()
        spending_data.columns = ['category', 'total_amount']

        return Response(spending_data.to_dict('records'))

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        user_transactions = Transaction.objects.filter(user=request.user).order_by('date')

        if not user_transactions.exists():
            return Response({'message': 'No transaction data available for monthly summary.'}, status=status.HTTP_200_OK)

        data = list(user_transactions.values('amount', 'type', 'date'))
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M') # Group by month

        monthly_summary = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0)

        # Convert period to string for JSON serialization
        monthly_summary.index = monthly_summary.index.astype(str)

        # Ensure both 'income' and 'expense' columns exist
        if 'income' not in monthly_summary.columns:
            monthly_summary['income'] = 0
        if 'expense' not in monthly_summary.columns:
            monthly_summary['expense'] = 0

        monthly_summary['net'] = monthly_summary['income'] - monthly_summary['expense']

        # Reset index to make 'month' a column
        result = monthly_summary.reset_index().rename(columns={'month': 'period'})

        return Response(result.to_dict('records'))

    @action(detail=False, methods=['get'])
    def budget_vs_actual(self, request):
        # Fetch active budgets for the user
        budgets = Budget.objects.filter(user=request.user).select_related('category')
        if not budgets.exists():
            return Response({'message': 'No budgets set for analysis.'}, status=status.HTTP_200_OK)

        budget_data = []
        for budget in budgets:
            # Calculate actual spending for the budget period and category
            actual_spent = Transaction.objects.filter(
                user=request.user,
                category=budget.category,
                type='expense',
                date__range=(budget.start_date, budget.end_date)
            ).aggregate(total_spent=Sum('amount'))['total_spent'] or 0

            budget_data.append({
                'category': budget.category.name,
                'allocated': float(budget.amount_allocated),
                'spent': float(actual_spent),
                'remaining': float(budget.amount_allocated - actual_spent),
            })

        # You could use Pandas here to further process or sort, but a direct list is fine for this structure
        # df_budgets = pd.DataFrame(budget_data)
        # return Response(df_budgets.to_dict('records'))

        return Response(budget_data)
    