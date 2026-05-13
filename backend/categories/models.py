from django.conf import settings
from django.db import models

class CategoryType(models.TextChoices):
    INCOME = 'INCOME', 'Income'
    EXPENSE = 'EXPENSE', 'Expense'

class Category(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    cat_type = models.CharField(max_length=50, choices=CategoryType.choices)
    icon = models.CharField(max_length=50, default="category")
    color = models.CharField(max_length=20, default="#3B82F6")

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name", "cat_type"],
                name="unique_category_per_user_and_type",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.cat_type})"