from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category, CategoryType
from users.models import User
from .models import CurrencyOption, Transaction
from .serializers import TransactionSerializer


class TransactionTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username="transaction-user", email="transaction@example.com", password="StrongPass123!"
		)
		self.other = User.objects.create_user(
			username="transaction-other", email="other-tx@example.com", password="StrongPass123!"
		)
		self.category = Category.objects.create(owner=self.user, name="Food", cat_type=CategoryType.EXPENSE)
		self.income = Category.objects.create(owner=self.user, name="Salary", cat_type=CategoryType.INCOME)
		self.client.force_authenticate(self.user)

	def transaction(self, **kwargs):
		values = {
			"owner": self.user, "amount": Decimal("25.50"), "currency": CurrencyOption.ARS,
			"date": date(2026, 8, 1), "description": "Lunch", "category": self.category,
		}
		values.update(kwargs)
		return Transaction.objects.create(**values)

	def test_model_string_and_custom_currency(self):
		tx = self.transaction(currency=CurrencyOption.CUSTOM, custom_currency="GBP")
		self.assertEqual(str(tx), "Food: 25.50 GBP on 2026-08-01")

	def test_custom_currency_is_required(self):
		with self.assertRaises(ValidationError):
			self.transaction(currency=CurrencyOption.CUSTOM, custom_currency=None)

	def test_standard_currency_clears_custom_currency(self):
		tx = self.transaction(custom_currency="OLD")
		self.assertIsNone(tx.custom_currency)

	def test_serializer_rejects_non_positive_amount(self):
		serializer = TransactionSerializer(data={"amount": "0", "date": "2026-08-01", "category": self.category.pk})
		self.assertFalse(serializer.is_valid())
		self.assertIn("amount", serializer.errors)

	def test_serializer_validates_category_owner(self):
		foreign = Category.objects.create(owner=self.other, name="Private", cat_type=CategoryType.EXPENSE)
		serializer = TransactionSerializer(
			data={"amount": "10", "date": "2026-08-01", "category": foreign.pk},
			context={"request": type("Request", (), {"user": self.user})()},
		)
		self.assertFalse(serializer.is_valid())

	def test_serializer_requires_custom_currency(self):
		serializer = TransactionSerializer(
			data={"amount": "10", "date": "2026-08-01", "category": self.category.pk, "currency": "CUSTOM"}
		)
		self.assertFalse(serializer.is_valid())

	def test_serializer_accepts_category_without_request_and_valid_custom_currency(self):
		serializer = TransactionSerializer()
		self.assertEqual(serializer.validate_category(self.category), self.category)
		request = type("Request", (), {"user": self.user})()
		self.assertEqual(TransactionSerializer(context={"request": request}).validate_category(self.category), self.category)
		result = serializer.validate({"currency": "CUSTOM", "custom_currency": "GBP"})
		self.assertEqual(result["custom_currency"], "GBP")

	def test_serializer_clears_custom_currency_for_standard_currency(self):
		serializer = TransactionSerializer()
		result = serializer.validate({"currency": "ARS", "custom_currency": "GBP"})
		self.assertIsNone(result["custom_currency"])

	def test_create_and_list_are_scoped_to_user(self):
		self.transaction()
		other_category = Category.objects.create(owner=self.other, name="Other", cat_type=CategoryType.EXPENSE)
		self.transaction(owner=self.other, category=other_category, description="Hidden")
		response = self.client.get("/api/transactions/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)

	def test_create_transaction_assigns_authenticated_owner(self):
		response = self.client.post("/api/transactions/", {"amount": "12.50", "date": "2026-08-01", "description": "Coffee", "category": self.category.pk, "currency": "ARS"}, format="json")
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(Transaction.objects.get(pk=response.data["id"]).owner, self.user)

	def test_list_filters(self):
		self.transaction(amount=Decimal("10"), date=date(2026, 7, 1), currency=CurrencyOption.USD)
		self.transaction(amount=Decimal("50"), date=date(2026, 8, 10), category=self.income)
		response = self.client.get(
			"/api/transactions/?start_date=2026-08-01&end_date=2026-08-31&category=%s&cat_type=EXPENSE&currency=ARS"
			% self.category.pk
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 0)

	def test_list_filters_each_optional_parameter(self):
		self.transaction()
		response = self.client.get("/api/transactions/?start_date=2026-01-01&end_date=2026-12-31&category=%s&cat_type=EXPENSE&currency=ARS" % self.category.pk)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_detail_cannot_access_other_users_transaction(self):
		other_category = Category.objects.create(owner=self.other, name="Other", cat_type=CategoryType.EXPENSE)
		tx = self.transaction(owner=self.other, category=other_category)
		self.assertEqual(self.client.get(f"/api/transactions/{tx.pk}/").status_code, status.HTTP_404_NOT_FOUND)

	def test_crud_requires_authentication(self):
		self.client.force_authenticate(None)
		self.assertEqual(self.client.get("/api/transactions/").status_code, status.HTTP_401_UNAUTHORIZED)
