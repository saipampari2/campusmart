from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPES = [("student", "student"), ("seller", "seller")]
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default="student")
