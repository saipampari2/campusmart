from django.urls import path
from .views import CartView, CartAddView, CartItemView

urlpatterns = [
    path("", CartView.as_view()),
    path("add/", CartAddView.as_view()),
    path("items/<int:pk>/", CartItemView.as_view()),
]
