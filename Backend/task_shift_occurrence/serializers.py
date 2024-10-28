from rest_framework import serializers

from .models import TaskShiftOccurrence


class TaskShiftOccurrenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskShiftOccurrence
        fields = '__all__'
