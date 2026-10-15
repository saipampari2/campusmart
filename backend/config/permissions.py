from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsSeller(BasePermission):
    message = "Only sellers can do this."
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.user_type == "seller")

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in SAFE_METHODS or obj.seller_id == request.user.id
