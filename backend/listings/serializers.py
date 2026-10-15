from rest_framework import serializers
from .models import Listing

class ListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = "__all__"
        read_only_fields = ["id", "rating", "total_reviews", "seller", "created_at"]

    def validate_price(self, v):
        if v <= 0:
            raise serializers.ValidationError("Price must be more than 0.")
        return v

class SellerListingSerializer(ListingSerializer):
    image_url = serializers.CharField(source="imageUrl", read_only=True)

    class Meta(ListingSerializer.Meta):
        fields = None
        exclude = ["imageUrl"]
