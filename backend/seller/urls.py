from django.urls import path
from .views import SellerListings, SellerOrders, AdvanceStatus, Dashboard

urlpatterns = [
    path("listings/", SellerListings.as_view()),
    path("orders/", SellerOrders.as_view()),
    path("orders/<int:pk>/status/", AdvanceStatus.as_view()),
    path("dashboard/", Dashboard.as_view()),
]
