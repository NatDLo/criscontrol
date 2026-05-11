from decimal import Decimal
from rest_framework import serializers
from categories.models import Category
from .models import Transaction, CurrencyOption


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_type = serializers.CharField(source="category.cat_type", read_only=True)
    currency_display = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "currency",
            "custom_currency",
            "currency_display",
            "date",
            "description",
            "category",
            "category_name",
            "category_type",
        ]
        read_only_fields = ["id", "category_name", "category_type", "currency_display"]

    def get_currency_display(self, obj):
        return obj.custom_currency if obj.currency == CurrencyOption.CUSTOM else obj.currency

    def validate_amount(self, value):
        if value <= Decimal("0"):
            raise serializers.ValidationError("El monto debe ser mayor que 0.")
        return value

    def validate_category(self, value):
        request = self.context.get("request")
        if not request:
            return value

        exists_for_user = Category.objects.filter(id=value.id, owner=request.user).exists()
        if not exists_for_user:
            raise serializers.ValidationError("La categoría no existe o no pertenece al usuario.")
        return value

    def validate(self, attrs):
        currency = attrs.get("currency", getattr(self.instance, "currency", None))
        custom_currency = attrs.get("custom_currency", getattr(self.instance, "custom_currency", None))

        if currency == CurrencyOption.CUSTOM and not custom_currency:
            raise serializers.ValidationError({"custom_currency": "Ingresa la moneda personalizada."})

        if currency != CurrencyOption.CUSTOM:
            attrs["custom_currency"] = None

        return attrs