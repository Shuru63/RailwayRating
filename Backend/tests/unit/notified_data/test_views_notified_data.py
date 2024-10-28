from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from user_onboarding.models import User, Roles, Station
from notified_task.models import notified_task
from notified_data.models import notified_data

class NotifiedFeedbackAPITestCase(TestCase):
    def setUp(self):
        # Create a sample user with appropriate permissions
        user_type = Roles.objects.create(name="railway manager")
        self.station = Station.objects.create(
            station_code=1,
            station_name='PNBE',
            chi_id=2
        )
        self.user = User.objects.create(
            username='testuser',
            email='testuser@example.com',  # Unique email address
            phone='1234567891',
            user_type=user_type,
            station=self.station
        )
        self.user.set_password('testpassword')
        self.user.save()
        
        # Create a sample notified task
        self.notified_task = notified_task.objects.create(
            task_id=1,
            task_description='Sample Task Description',
            created_by='testuser',
            updated_by='testuser'
        )

        # Set up the API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_notified_data(self):
        url = reverse('send_feedback_msg', args=[self.notified_task.id])
        feedback_data = {
            'feedback': 'Sample feedback'
        }

        response = self.client.post(url, feedback_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(notified_data.objects.count(), 0)
        # self.assertEqual(notified_data.objects.first().feedback, 'Sample feedback')

    def test_create_notified_data_invalid_feedback(self):
        url = reverse('send_feedback_msg', args=[self.notified_task.id])
        feedback_data = {
            'feedback': ''  # Invalid empty feedback
        }

        response = self.client.post(url, feedback_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(notified_data.objects.count(), 0)

    def test_create_notified_data_unauthorized_user(self):
        # Create a user without railway manager permissions
        user_type = Roles.objects.create(name="supervisor")
        unauthorized_user = User.objects.create(
            username='unauthorizeduser',
            email='unauthorizeduser@example.com',  # Unique email address
            phone='9876543210',
            user_type=user_type,
            station=self.station
        )
        unauthorized_user.set_password('testpassword')
        unauthorized_user.save()

        # Authenticate with the unauthorized user
        self.client.force_authenticate(user=unauthorized_user)

        url = reverse('send_feedback_msg', args=[self.notified_task.id])
        feedback_data = {
            'feedback': 'Sample feedback'
        }

        response = self.client.post(url, feedback_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(notified_data.objects.count(), 0)
