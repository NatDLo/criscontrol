from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('amount', 'date', 'category', 'description')
    list_filter = ('date', 'category')
    search_fields = ('description',)
    ordering = ('-date',)
    