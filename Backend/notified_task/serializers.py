from rest_framework import serializers

from .models import notified_task


class NotifiedTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = notified_task
        fields = ('task_id', 'task_description')
        