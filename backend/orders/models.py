from decimal import Decimal
from django.conf import settings
from django.db import models

class Order(models.Model):
    PAYMENT = [("COD", "Cash at Meetup"), ("ONLINE", "Pay Now")]
    MEETUP = [("MAIN_GATE", "Main Gate"), ("LIBRARY", "Library Steps"), ("CANTEEN", "Canteen")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    payment_method = models.CharField(max_length=10, choices=PAYMENT)
    meetup_point = models.CharField(max_length=20, choices=MEETUP)
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=60)
    state = models.CharField(max_length=60)
    pincode = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]

    @property
    def status(self):
        st = [i.status for i in self.items.all()]
        active = [s for s in st if s != "cancelled"]
        if not st or not active:
            return "cancelled" if st else "placed"
        if all(s == "delivered" for s in active):
            return "delivered"
        if any(s in ("shipped", "delivered") for s in active):
            return "shipped"
        return "placed"

    @property
    def is_paid(self):
        if self.status == "cancelled":
            return False
        return self.payment_method == "ONLINE" or self.status == "delivered"

    @property
    def can_cancel(self):
        st = [i.status for i in self.items.all()]
        return bool(st) and all(s in ("placed", "cancelled") for s in st) and any(s == "placed" for s in st)

    @property
    def total_price(self):
        return sum((i.price * i.quantity for i in self.items.all() if i.status != "cancelled"), Decimal("0"))

class OrderItem(models.Model):
    STATUS = [(s, s) for s in ("placed", "shipped", "delivered", "cancelled")]
    NEXT = {"placed": "shipped", "shipped": "delivered"}

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    listing = models.ForeignKey("listings.Listing", null=True, on_delete=models.SET_NULL)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="sold_items")
    # copy these so old orders dont change when price changes
    title = models.CharField(max_length=150)
    hostel = models.CharField(max_length=60)
    condition = models.CharField(max_length=20)
    image_url = models.URLField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=10, choices=STATUS, default="placed")
