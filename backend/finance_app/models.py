# backend/finance_app/models.py
from django.db import models
from django.contrib.auth.models import User # Django's built-in User model

class Category(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=[('income', 'Income'), ('expense', 'Expense')])
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')

    class Meta:
        unique_together = ('name', 'type', 'user') # Ensure unique category per user/type

    def __str__(self):
        return f"{self.name} ({self.type})"

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=10, choices=[('income', 'Income'), ('expense', 'Expense')])
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at'] # Order by date descending

    def __str__(self):
        return f"{self.type.capitalize()} of {self.amount} on {self.date} by {self.user.username}"

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount_allocated = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        unique_together = ('user', 'category', 'start_date', 'end_date')

    def __str__(self):
        return f"Budget for {self.category.name} by {self.user.username} from {self.start_date} to {self.end_date}"