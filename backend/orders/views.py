from django.db import transaction
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from cart.views import my_cart
from .models import Order, OrderItem
from .serializers import CheckoutSerializer, OrderSerializer

class OrderListCreate(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")

    @transaction.atomic
    def post(self, request):
        s = CheckoutSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        cart = my_cart(request.user)
        rows = list(cart.items.select_related("listing", "listing__seller"))
        if not rows:
            return Response({"detail": "Your cart is empty."}, status=400)
        if any(r.listing.availability != "Available" for r in rows):
            return Response({"detail": "Some listings are already sold."}, status=400)
        d = s.validated_data
        order = Order.objects.create(user=request.user, payment_method=d["payment_method"],
                                     meetup_point=d["meetup_point"], **d["address"])
        for r in rows:
            l = r.listing
            OrderItem.objects.create(order=order, listing=l, seller=l.seller, title=l.title,
                                     hostel=l.hostel, condition=l.condition, image_url=l.imageUrl,
                                     price=l.price, quantity=r.quantity)
        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderDetail(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class OrderCancel(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        order = Order.objects.filter(user=request.user, pk=pk).first()
        if not order:
            return Response({"detail": "Not found."}, status=404)
        if not order.can_cancel:
            return Response({"detail": "This order can no longer be cancelled."}, status=400)
        order.items.filter(status="placed").update(status="cancelled")
        return Response(OrderSerializer(Order.objects.get(pk=pk)).data)
