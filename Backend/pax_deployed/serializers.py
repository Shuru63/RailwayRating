from rest_framework import serializers
from .models import Pax


class PaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pax
        fields = '__all__'
