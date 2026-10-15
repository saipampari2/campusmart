from django.conf import settings
from django.db import models

class Listing(models.Model):
    CONDITIONS = [(c, c) for c in ("Like New", "Good", "Fair")]
    CATEGORIES = [(c, c) for c in ("Books", "Electronics", "Hostel Essentials", "Cycles", "Sports")]
    AVAILABILITY = [("Available", "Available"), ("Sold", "Sold")]

    title = models.CharField(max_length=150)
    hostel = models.CharField(max_length=60)
    condition = models.CharField(max_length=20, choices=CONDITIONS, default="Good")
    negotiable = models.BooleanField(default=False)
    category = models.CharField(max_length=30, choices=CATEGORIES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    imageUrl = models.URLField(blank=True)
    rating = models.FloatField(default=0)
    total_reviews = models.IntegerField(default=0)
    availability = models.CharField(max_length=10, choices=AVAILABILITY, default="Available")
    description = models.TextField(blank=True)
    is_senior_deal = models.BooleanField(default=False)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title
