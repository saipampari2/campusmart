import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from listings.models import Listing
from orders.models import Order, OrderItem
from users.models import User

DATA = {
    "Books": ("Engineering Mathematics Textbook Set|Data Structures in C|Physics Lab Manual|Organic Chemistry Notes|"
              "DBMS Concepts Book|Operating Systems Textbook|Engineering Drawing Book|Digital Electronics Guide|"
              "Python Programming Book|Aptitude Prep Guide|English Communication Reader|Thermodynamics Textbook|"
              "Discrete Math Notes|Computer Networks Book|GATE Previous Papers", (150, 600)),
    "Electronics": ("Scientific Calculator|Bluetooth Earphones|Power Bank 10000mAh|LED Table Lamp|Extension Board|"
                    "Laptop Cooling Pad|USB Hub|Rechargeable Mini Fan|Wireless Mouse|Mechanical Keyboard|"
                    "Phone Stand|Electric Kettle|Raspberry Pi Kit|Smart Watch", (300, 2500)),
    "Hostel Essentials": ("Single Bed Mattress|Bucket and Mug Set|Foldable Study Table|Storage Trunk|Curtain Set|"
                          "Mosquito Net|Clothes Drying Rack|Bedsheet Set|Wall Mirror|Plastic Chair|"
                          "Water Bottle Set|Shoe Rack|Iron Box", (100, 1500)),
    "Cycles": ("Hero Sprint Cycle|Firefox Road Bike|Atlas Gear Cycle|Hercules Roadeo|BSA Mountain Bike|"
               "Cycle Lock Chain|Cycle Helmet|Cycle Basket|Foldable Cycle|Ladies Cycle|Hybrid Cycle|Cycle Repair Kit",
               (1500, 6000)),
}
SENIOR_IDS = {9, 11, 18, 20, 42, 50}
HOSTELS = ["Hostel A", "Hostel B", "Hostel C", "Hostel D", "Hostel E"]

class Command(BaseCommand):
    help = "Seed Priya (seller), Arjun (student) and 54 listings. Safe to run twice."

    def add_arguments(self, p):
        p.add_argument("--with-orders", action="store_true")
        p.add_argument(
            "--public-demo",
            action="store_true",
            help="Disable login for the demo accounts while seeding public demo listings.",
        )

    def handle(self, *a, **o):
        priya, created = User.objects.get_or_create(username="Priya", defaults={"user_type": "seller"})
        if o["public_demo"]:
            priya.set_unusable_password()
            priya.save(update_fields=["password"])
        elif created:
            priya.set_password("secret123")
            priya.save()

        arjun, created = User.objects.get_or_create(username="Arjun", defaults={"user_type": "student"})
        if o["public_demo"]:
            arjun.set_unusable_password()
            arjun.save(update_fields=["password"])
        elif created:
            arjun.set_password("secret123")
            arjun.save()

        rnd, n = random.Random(7), 0
        for cat, (names, (lo, hi)) in DATA.items():
            for title in names.split("|"):
                n += 1
                Listing.objects.get_or_create(title=title, defaults=dict(
                    seller=priya, category=cat, hostel=rnd.choice(HOSTELS),
                    condition=rnd.choice(["Like New", "Good", "Fair"]), negotiable=rnd.random() < 0.5,
                    price=round(rnd.randint(lo, hi), -1), imageUrl=f"https://picsum.photos/seed/listing{n}/300/300",
                    rating=round(rnd.uniform(3, 5), 1), total_reviews=rnd.randint(2, 60),
                    description=f"{title} in good shape, selling before the term ends.",
                    is_senior_deal=False))
        Listing.objects.filter(pk__in=SENIOR_IDS).update(is_senior_deal=True)
        self.stdout.write(f"Listings: {Listing.objects.count()}")

        if o["with_orders"] and not Order.objects.exists():
            pool = list(Listing.objects.all())
            for days_ago in (0, 1, 2, 3, 5, 6):
                order = Order.objects.create(user=arjun, payment_method="COD", meetup_point="LIBRARY",
                    full_name="Arjun K", phone="9876500000", address="Hostel B, Room 12",
                    city="Hyderabad", state="Telangana", pincode="500001")
                for l in rnd.sample(pool, rnd.randint(1, 2)):
                    OrderItem.objects.create(order=order, listing=l, seller=priya, title=l.title, hostel=l.hostel,
                        condition=l.condition, image_url=l.imageUrl, price=l.price,
                        quantity=rnd.randint(1, 2), status="delivered")
                Order.objects.filter(pk=order.pk).update(created_at=timezone.now() - timedelta(days=days_ago))
            self.stdout.write("Six delivered orders created.")
