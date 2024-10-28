from django.core.exceptions import ValidationError
from rest_framework import serializers
import re

from .models import Feedback


def validate_mobile_no(value):
    if value and not re.match(r'^\d{10}$', value):
        raise ValidationError("Mobile number must be exactly 10 digits and contain no alphabets")
    
    return value


class FeedbackSerializer(serializers.ModelSerializer):
    passenger_name = serializers.CharField(required=True)
    mobile_no = serializers.CharField(validators=[validate_mobile_no], allow_null=True, required=False)


    class Meta:
        model = Feedback
        fields = '__all__'


class FeedbackUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = [
            'id',
            'feedback_value_1',
            'feedback_value_2',
            'feedback_value_3',
            'feedback_value_4',
            'feedback_value_5',
            'passenger_name',
            'verified',
            'mobile_no',
            'email',
            'ticket_no',
            'status',
            'updated_at',
            'updated_by'
            ]
        read_only_fields = ['id', 'updated_at', 'updated_by']


class FeedbackStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = [
            'id',
            'status',
            'updated_at',
            'updated_by'
            ]
        read_only_fields = ['id', 'updated_at', 'updated_by']
