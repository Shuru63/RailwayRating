from rest_framework import serializers
from .models import Inspection_feedback, Image


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['id', 'image']
        
class InspectionFeedbackSerializer(serializers.ModelSerializer):
    images = ImageSerializer(many=True, required=False, source='feedback_images')

    class Meta:
        model = Inspection_feedback
        fields = '__all__'
