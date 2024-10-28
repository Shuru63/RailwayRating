import datetime
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from ratings.models import Rating
from user_onboarding.models import User, Roles
from task_shift_occurrence.models import TaskShiftOccurrence
from ratings.serializers import RatingSerializer, UpdateRatingSerializer, TaskStatusUpdateSerializer


class SerializerTestCase(TestCase):
    def setUp(self):
        role = Roles.objects.create(name="supervisor")  # Adjust this based on your actual Roles model
        self.user = User.objects.create(username="test_user", phone="1234567890", user_type_id=role.id)

    def test_rating_serializer(self):
        data = {
            'task_status': 'Test status',
            'rating_value': 5,
            'date': datetime.date.today(),
            'task_shift_occur_id': self.task_shift_occurrence.id,
            'user': self.user.id,
        }
        serializer = RatingSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_update_rating_serializer(self):
        rating = Rating.objects.create(
            task_status='Initial status',
            rating_value=3,
            date=datetime.date.today(),
            task_shift_occur_id=self.task_shift_occurrence,
            user=self.user
        )
        data = {
            'rating_value': 4,
            'task_status': 'Updated status',
            'user_id': self.user.id,
        }
        serializer = UpdateRatingSerializer(rating, data=data)
        self.assertTrue(serializer.is_valid())

    def test_task_status_update_serializer(self):
        rating = Rating.objects.create(
            task_status='Initial status',
            rating_value=3,
            date=datetime.date.today(),
            task_shift_occur_id=self.task_shift_occurrence,
            user=self.user
        )
        data = {
            'task_status_admin': 'New status'
        }
        context = {'request': {'user': self.user}}
        serializer = TaskStatusUpdateSerializer(rating, data=data, context=context)
        self.assertTrue(serializer.is_valid())

    def tearDown(self):
        self.user.delete()
        self.task_shift_occurrence.delete()
