from django.urls import path
from .views import OrderListCreate, OrderDetail, OrderCancel

urlpatterns = [
    path("", OrderListCreate.as_view()),
    path("<int:pk>/", OrderDetail.as_view()),
    path("<int:pk>/cancel/", OrderCancel.as_view()),
]
