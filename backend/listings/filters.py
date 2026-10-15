import django_filters as df
from .models import Listing

class ListingFilter(df.FilterSet):
    rating = df.NumberFilter(field_name="rating", lookup_expr="gte")  # 4 and above

    class Meta:
        model = Listing
        fields = ["category", "hostel", "is_senior_deal"]
