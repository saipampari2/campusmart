from rest_framework.exceptions import NotAuthenticated

def visible_listings(request, qs):
    if request.user.is_authenticated:
        return qs
    if request.query_params.get("is_senior_deal", "").lower() in ("true", "1"):
        raise NotAuthenticated("Log in to see Senior-Only Deals.")
    return qs.filter(is_senior_deal=False)
