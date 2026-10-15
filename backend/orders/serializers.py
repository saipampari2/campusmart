from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "listing", "title", "hostel", "condition", "image_url", "price", "quantity", "status"]

class AddressSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=15)
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=60)
    state = serializers.CharField(max_length=60)
    pincode = serializers.CharField(max_length=10)

class CheckoutSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=[c[0] for c in Order.PAYMENT])
    meetup_point = serializers.ChoiceField(choices=[c[0] for c in Order.MEETUP])
    address = AddressSerializer()

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status = serializers.CharField(read_only=True)
    is_paid = serializers.BooleanField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    total_price = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "created_at", "status", "is_paid", "can_cancel", "payment_method",
                  "meetup_point", "address", "total_price", "total_items", "items"]

    def get_total_price(self, o):
        return f"{o.total_price:.2f}"

    def get_total_items(self, o):
        return sum(i.quantity for i in o.items.all() if i.status != "cancelled")

    def get_address(self, o):
        return {k: getattr(o, k) for k in ("full_name", "phone", "address", "city", "state", "pincode")}
