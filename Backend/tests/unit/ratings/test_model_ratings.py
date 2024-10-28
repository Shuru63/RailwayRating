from django.test import TestCase
from user_onboarding.models import User, Roles
from ratings.models import Rating, TaskShiftOccurUser
from task_shift_occurrence.models import TaskShiftOccurrence
from user_onboarding.models import Station

class ModelTestCase(TestCase):
    def setUp(self):
        role = Roles.objects.create(name="Test Role")  # Create a test role
        station = Station.objects.create(station_name='Test Station', station_id=1, station_code=1234, chi_id=123, station_zone='Test Zone', station_penalty=0.0, name_of_work='Test Work', contract_by='Test Contractor', contract_no='12345')
        self.user = User.objects.create(username='test_user', email='test@example.com', phone='1234567890', station=station, user_type=role)  # Include the user_type field
        self.task_shift_occurrence = TaskShiftOccurrence.objects.create()  # Add relevant fields for TaskShiftOccurrence
        self.rating = Rating.objects.create(rating_value='4', date='2023-10-10', task_shift_occur_id=self.task_shift_occurrence, user=self.user, created_by='test_user', updated_by='test_user')
        self.task_shift_occur_user = TaskShiftOccurUser.objects.create(task_shift_occur_id=self.task_shift_occurrence, user=self.user)

    # def test_rating_creation(self):
    #     self.assertTrue(isinstance(self.rating, Rating))
    #     self.assertEqual(self.rating.__str__(), f"{self.user.station.station_name}/{self.rating.date}/{self.task_shift_occurrence.shift.shift_id}/{self.task_shift_occurrence.task.task_id}/{self.task_shift_occurrence.occurrence_id}")

    def test_task_shift_occur_user_creation(self):
        self.assertTrue(isinstance(self.task_shift_occur_user, TaskShiftOccurUser))
        self.assertEqual(self.task_shift_occur_user.__str__(), f"{self.task_shift_occur_user.user_name} ({self.task_shift_occur_user.task_shift_occur_id})")
