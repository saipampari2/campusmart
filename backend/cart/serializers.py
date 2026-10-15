from rest_framework import serializers
from .models import Cart, CartItem

class CartItemSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    listing_condition = serializers.CharField(source="listing.condition", read_only=True)
    listing_price = serializers.DecimalField(source="listing.price", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "listing", "listing_title", "listing_condition", "listing_price", "quantity"]

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total_items", "total_price"]

    def get_total_items(self, cart):
        return sum(i.quantity for i in cart.items.all())

    def get_total_price(self, cart):
        return str(sum(i.quantity * i.listing.price for i in cart.items.select_related("listing")) or "0.00")
