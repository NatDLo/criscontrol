from django.contrib import admin
from .models import Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'cat_type', 'description')
    list_filter = ('cat_type',)
    search_fields = ('name', 'description')
    ordering = ('name',)

    