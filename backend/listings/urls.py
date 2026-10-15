from django.urls import path
from .views import ListingListCreate, ListingDetail

urlpatterns = [
    path("", ListingListCreate.as_view()),
    path("<int:pk>/", ListingDetail.as_view()),
]
