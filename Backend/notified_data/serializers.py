from rest_framework import serializers

from .models import notified_data
from notified_task.serializers import NotifiedTaskSerializer


class ComplaintSerializer(serializers.ModelSerializer):
    task = NotifiedTaskSerializer(read_only=True)
    class Meta:
        model = notified_data
        fields = [
            'id', 
            'task', 
            'date', 
            'feedback', 
            'created_at', 
            'created_by', 
            'updated_at', 
            'updated_by',
            'latitude',
            'longitude'
            ]
        

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = notified_data
        fields = [
            'id',
            'feedback',
            'latitude',
            'longitude',
            'updated_at',
            'updated_by'
            ]
        read_only_fields = ['id', 'updated_at', 'updated_by']
