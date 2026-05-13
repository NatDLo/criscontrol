from rest_framework import generics

from users.permissions import IsAuthenticated
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = (
            Transaction.objects.filter(owner=self.request.user).select_related("category")
        )

        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        category_id = self.request.query_params.get("category")
        cat_type = self.request.query_params.get("cat_type")
        currency = self.request.query_params.get("currency")

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if cat_type:
            queryset = queryset.filter(category__cat_type=cat_type)
        if currency:
            queryset = queryset.filter(currency__iexact=currency)

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Transaction.objects.filter(owner=self.request.user).select_related("category")
        )