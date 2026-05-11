from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError

class CurrencyOption(models.TextChoices):
    ARS = 'ARS', 'Peso Argentino'
    USD = 'USD', 'US Dollar'
    EUR = 'EUR', 'Euro'
    CUSTOM = 'CUSTOM', 'Crear Nueva Moneda'
    
class Transaction(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(
        max_length=10,
        choices=CurrencyOption.choices,
        default=CurrencyOption.ARS,
    )
    custom_currency = models.CharField(max_length=10, blank=True, null=True)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="transactions",
    )

    class Meta:
        ordering = ["-date", "-id"]

    def clean(self):
        if self.currency == CurrencyOption.CUSTOM and not self.custom_currency:
            raise ValidationError({"custom_currency": "Ingresa la moneda personalizada."})
        if self.currency != CurrencyOption.CUSTOM:
            self.custom_currency = None

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        display_currency = self.custom_currency if self.currency == CurrencyOption.CUSTOM else self.currency
        return f"{self.category.name}: {self.amount} {display_currency} on {self.date}"