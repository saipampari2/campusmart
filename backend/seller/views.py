from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import generics, serializers
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView
from config.permissions import IsSeller
from listings.models import Listing
from listings.serializers import SellerListingSerializer
from orders.models import OrderItem

class SellerListings(generics.ListAPIView):
    serializer_class = SellerListingSerializer
    permission_classes = [IsSeller]
    filter_backends = [SearchFilter]
    search_fields = ["title", "hostel"]

    def get_queryset(self):
        return Listing.objects.filter(seller=self.request.user)

class SellerItemSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id")
    amount = serializers.SerializerMethodField()
    meetup_point = serializers.CharField(source="order.meetup_point")
    created_at = serializers.DateTimeField(source="order.created_at")
    next_status = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "order_id", "title", "quantity", "amount", "status",
                  "next_status", "meetup_point", "created_at"]

    def get_amount(self, i):
        return f"{i.price * i.quantity:.2f}"

    def get_next_status(self, i):
        return OrderItem.NEXT.get(i.status)

class SellerOrders(generics.ListAPIView):
    serializer_class = SellerItemSerializer
    permission_classes = [IsSeller]

    def get_queryset(self):
        return OrderItem.objects.filter(seller=self.request.user).select_related("order").order_by("-order__created_at", "-id")

class AdvanceStatus(APIView):
    permission_classes = [IsSeller]

    def patch(self, request, pk):
        item = OrderItem.objects.filter(seller=request.user, pk=pk).select_related("order").first()
        if not item:
            return Response({"detail": "Not found."}, status=404)
        nxt = OrderItem.NEXT.get(item.status)
        if not nxt:
            return Response({"detail": f"A {item.status} row cannot move forward."}, status=400)
        item.status = nxt
        item.save()
        return Response(SellerItemSerializer(item).data)

class Dashboard(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        mine = OrderItem.objects.filter(seller=request.user).select_related("order")
        live = [i for i in mine if i.status != "cancelled"]
        delivered = [i for i in live if i.status == "delivered"]

        today = timezone.localdate()
        per_day = defaultdict(lambda: {"items": 0, "revenue": Decimal("0")})
        for i in live:
            d = timezone.localtime(i.order.created_at).date()
            per_day[d]["items"] += i.quantity
            per_day[d]["revenue"] += i.price * i.quantity
        last_7 = [{"date": str(day), "items": per_day[day]["items"], "revenue": f"{per_day[day]['revenue']:.2f}"}
                  for day in (today - timedelta(days=n) for n in range(6, -1, -1))]

        top = defaultdict(int)
        for i in live:
            top[i.title] += i.quantity
        by_status = {s: sum(1 for i in mine if i.status == s) for s in ("placed", "shipped", "delivered", "cancelled")}

        return Response({
            "total_listings": Listing.objects.filter(seller=request.user).count(),
            "total_orders": len({i.order_id for i in live}),
            "items_sold": sum(i.quantity for i in delivered),
            "revenue": f"{sum((i.price * i.quantity for i in delivered), Decimal('0')):.2f}",
            "still_to_hand_over": by_status["placed"] + by_status["shipped"],
            "last_7_days": last_7,
            "top_listings": [{"title": t, "quantity": q} for t, q in sorted(top.items(), key=lambda x: -x[1])[:5]],
            "items_by_status": by_status,
        })
