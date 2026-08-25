from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Category, CategoryType
from .serializers import CategorySerializer


class CategoryTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username="category-user", email="category@example.com", password="StrongPass123!"
		)
		self.other = User.objects.create_user(
			username="other-user", email="other@example.com", password="StrongPass123!"
		)
		self.client.force_authenticate(self.user)

	def category(self, owner=None, name="Food", cat_type=CategoryType.EXPENSE):
		return Category.objects.create(owner=owner or self.user, name=name, cat_type=cat_type)

	def test_model_string_and_ordering(self):
		category = self.category(name="Salary", cat_type=CategoryType.INCOME)
		self.assertEqual(str(category), "Salary (INCOME)")

	def test_unique_category_per_user_and_type(self):
		self.category()
		with self.assertRaises(IntegrityError):
			self.category()

	def test_serializer_strips_name_and_defaults_optional_values(self):
		serializer = CategorySerializer(data={"name": "  Food  ", "cat_type": "EXPENSE"})
		self.assertTrue(serializer.is_valid(), serializer.errors)
		self.assertEqual(serializer.validated_data["name"], "Food")
		category = serializer.save(owner=self.user)
		self.assertEqual(category.icon, "category")

	def test_serializer_rejects_blank_name(self):
		serializer = CategorySerializer(data={"name": "   ", "cat_type": "EXPENSE"})
		self.assertFalse(serializer.is_valid())

	def test_serializer_normalizes_icon_and_color(self):
		serializer = CategorySerializer(
			data={"name": "Food", "cat_type": "EXPENSE", "icon": "  restaurant  ", "color": "  #fff  "}
		)
		self.assertTrue(serializer.is_valid(), serializer.errors)
		self.assertEqual(serializer.validated_data["icon"], "restaurant")
		self.assertEqual(serializer.validated_data["color"], "#fff")

	def test_serializer_defaults_empty_icon_and_color(self):
		self.assertEqual(CategorySerializer().validate_name("  Name  "), "Name")
		with self.assertRaises(Exception):
			CategorySerializer().validate_name("   ")
		self.assertEqual(CategorySerializer().validate_icon(None), "category")
		self.assertEqual(CategorySerializer().validate_color(None), "#3B82F6")

	def test_list_only_returns_current_users_categories(self):
		self.category()
		self.category(owner=self.other, name="Other")
		response = self.client.get("/api/categories/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)

	def test_create_assigns_authenticated_owner(self):
		response = self.client.post(
			"/api/categories/", {"name": "Salary", "cat_type": "INCOME"}, format="json"
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(Category.objects.get(pk=response.data["id"]).owner, self.user)

	def test_detail_cannot_access_other_users_category(self):
		category = self.category(owner=self.other, name="Private")
		response = self.client.get(f"/api/categories/{category.pk}/")
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_crud_requires_authentication(self):
		self.client.force_authenticate(None)
		self.assertEqual(self.client.get("/api/categories/").status_code, status.HTTP_401_UNAUTHORIZED)
