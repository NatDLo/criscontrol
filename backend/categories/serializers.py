from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description", "cat_type", "icon", "color"]
        read_only_fields = ["id"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("The name cannot be empty. / El nombre no puede estar vacío.")
        return value

    def validate_icon(self, value):
        return (value or "category").strip()

    def validate_color(self, value):
        return (value or "#3B82F6").strip()