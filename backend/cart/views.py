from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from listings.models import Listing
from .models import Cart, CartItem
from .serializers import CartSerializer

def my_cart(user):
    return Cart.objects.get_or_create(user=user)[0]

def parse_qty(value, default=1):
    try:
        q = int(value if value is not None else default)
    except (TypeError, ValueError):
        return None
    return q if q >= 1 else None

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CartSerializer(my_cart(request.user)).data)

class CartAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        qty = parse_qty(request.data.get("quantity"))
        if qty is None:
            return Response({"quantity": ["Must be 1 or more."]}, status=400)
        try:
            listing = Listing.objects.get(pk=request.data.get("listing"))
        except (Listing.DoesNotExist, ValueError, TypeError):
            return Response({"listing": ["No such listing."]}, status=400)
        if listing.availability != "Available":
            return Response({"detail": "This listing is sold."}, status=400)
        cart = my_cart(request.user)
        item, created = CartItem.objects.get_or_create(cart=cart, listing=listing, defaults={"quantity": qty})
        if not created:
            item.quantity += qty
            item.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def _item(self, request, pk):
        return CartItem.objects.filter(cart__user=request.user, pk=pk).first()

    def patch(self, request, pk):  # sets quantity, not add
        item = self._item(request, pk)
        if not item:
            return Response({"detail": "Not found."}, status=404)
        qty = parse_qty(request.data.get("quantity"), default=0)
        if qty is None:
            return Response({"quantity": ["Must be 1 or more."]}, status=400)
        item.quantity = qty
        item.save()
        return Response(CartSerializer(item.cart).data)

    def delete(self, request, pk):
        item = self._item(request, pk)
        if not item:
            return Response({"detail": "Not found."}, status=404)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
