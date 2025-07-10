# backend/finance_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MyTokenObtainPairView, RegisterView,
    CategoryViewSet, TransactionViewSet, BudgetViewSet,
    AnalysisViewSet
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'analysis', AnalysisViewSet, basename='analysis') # basename is required for ViewSet not linked to a model
router.register(r'auth/register', RegisterView, basename='register')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
