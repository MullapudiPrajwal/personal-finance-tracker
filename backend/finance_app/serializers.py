# backend/finance_app/serializers.py
from rest_framework import serializers
from .models import Category, Transaction, Budget
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'user']
        read_only_fields = ['user'] # User is set by the view

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True) # For displaying category name

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'category', 'category_name', 'description', 'date', 'created_at', 'updated_at', 'user']
        read_only_fields = ['user', 'created_at', 'updated_at']

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True) # For displaying category name

    class Meta:
        model = Budget
        fields = ['id', 'category', 'category_name', 'amount_allocated', 'start_date', 'end_date', 'user']
        read_only_fields = ['user']
        