from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password", "user_type"]
        extra_kwargs = {"password": {"write_only": True, "min_length": 4},
                        "email": {"required": False}}

    def create(self, data):
        return User.objects.create_user(**data)
