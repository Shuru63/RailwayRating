from rest_framework import serializers
from .models import Media


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        exclude = ['feedback_complaint']


class NotifiedMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = [
            'id',
            'image',
            'user',
            'date',
            'feedback_complaint',
            'created_at',
            'created_by',
            'updated_at',
            'updated_by',
            'latitude',
            'longitude'
        ]

