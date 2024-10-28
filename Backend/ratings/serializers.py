from rest_framework import serializers

from .models import Rating


class GetRatingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = '__all__'


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ('task_status', 'rating_value', 'date', 'task_shift_occur_id', 'user')


    def create(self, validated_data):
        return Rating.objects.create(**validated_data)


class UpdateRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['rating_value', 'task_status']


    def update(self, instance, validated_data):
        instance.rating_value = validated_data.get('rating_value', instance.rating_value)
        instance.task_status = validated_data.get('task_status', instance.task_status)
        instance.save()
        return instance


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['task_status']


    def update(self, instance, validated_data):
        try:
            instance.task_status = validated_data.get('task_status', instance.task_status)
            instance.save()
            return instance
        
        except Exception as e:
            raise serializers.ValidationError(f"An error occurred in TaskStatusUpdateSerializer: {repr(e)}")
