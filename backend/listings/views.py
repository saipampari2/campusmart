from rest_framework import generics
from rest_framework.exceptions import NotAuthenticated
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from config.permissions import IsSeller, IsOwnerOrReadOnly
from .filters import ListingFilter
from .models import Listing
from .serializers import ListingSerializer
from .visibility import visible_listings

class ListingListCreate(generics.ListCreateAPIView):
    serializer_class = ListingSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ListingFilter
    search_fields = ["title", "hostel"]
    ordering_fields = ["price", "rating", "id"]

    def get_permissions(self):
        return [IsSeller()] if self.request.method == "POST" else [AllowAny()]

    def get_queryset(self):
        return visible_listings(self.request, Listing.objects.all())

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class ListingDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ListingSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return [AllowAny()]

    def get_queryset(self):
        qs = Listing.objects.all()
        if not self.request.user.is_authenticated and \
                qs.filter(pk=self.kwargs["pk"], is_senior_deal=True).exists():
            raise NotAuthenticated("Log in to see Senior-Only Deals.")
        return qs
