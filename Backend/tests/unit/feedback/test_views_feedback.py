from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date

from tests.setup import TestObjectFactory
from feedback.models import Feedback


class FeedbackAPITest(TestCase):
    def setUp(self):
        factory = TestObjectFactory()

        self.user_type = factory.create_role("supervisor")
        self.unauthorized_role = factory.create_role("unauthorized")
        self.station = factory.create_station('Test Station', 1, 2)
        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        self.user2 = factory.create_user("testuser2", 'test2@email.com', self.unauthorized_role, self.station, '1234567890')
        factory.create_assign_permission(self.user)
        factory.create_assign_permission(self.user2)

        access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.user2)
        self.client = APIClient()
        self.client2 = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')

        self.feedback = Feedback.objects.create(
            feedback_value_1='2',
            feedback_value_2='1',
            feedback_value_3='0',
            feedback_value_4='2',
            feedback_value_5='1',
            passenger_name='John Doe',
            mobile_no='1234567891',
            ticket_no='ABC123',
            email='test@example.com',
            verified=True,
            date=date(2023, 11, 23),
            time='12:00:00',
            user=self.user,
            created_by='Test User',
            station=self.station,
        )


    def test_passenger_feedback(self):
        url = reverse('passenger_feedback')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_passenger_feedback_unauthorized_role(self):
        url = reverse('passenger_feedback')

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_feedback_with_valid_data(self):
        url = reverse('add_feedback', args=[self.station.station_code])
        post_data = {
            'feedback_1': '2',
            'feedback_2': '3',
            'feedback_3': '4',
            'feedback_4': '5',
            'feedback_5': '6',
            'date': '2023-11-22',
            'passenger_name': 'John Doe',
            'mobile_no': '1234567891',
            'ticket_no': 'ABC123',
            'email_id': 'test@example.com',
            'verification_status': 'yes',
        }

        response = self.client.post(url, post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


    def test_create_feedback_unauthorized_role(self):
        url = reverse('add_feedback', args=[self.station.station_code])
        post_data = {
            'feedback_1': '2',
            'feedback_2': '3',
            'feedback_3': '4',
            'feedback_4': '5',
            'feedback_5': '6',
            'date': '2023-11-22',
            'passenger_name': 'John Doe',
            'mobile_no': '1234567891',
            'ticket_no': 'ABC123',
            'email_id': 'test@example.com',
            'verification_status': 'yes',
        }

        response = self.client2.post(url, post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_feedback_with_invalid_data(self):
        url = reverse('add_feedback', args=[self.station.station_code])
        # Invalid data, missing 'feedback_1' field
        data = {
            'feedback_2': '1',
            'feedback_3': '0',
            'feedback_4': '2',
            'feedback_5': '1',
            'passenger_name': 'John Doe',
            'mobile_no': '1234567891',
            'ticket_no': 'ABC123',
            'email_id': 'test@example.com',
            'verification_status': 'yes',
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Missing data: feedback_1')


    def test_update_feedback(self):
        url = reverse('update_feedback', args=[self.feedback.id])
        data = {
            'feedback_value_1': '1',
            'feedback_value_2': '0',
            'feedback_value_3': '2',
            'feedback_value_4': '1',
            'feedback_value_5': '0',
            'date': date(2023, 11, 24),
            'passenger_name': 'Updated Name',
            'mobile_no': '9876543210',
            'ticket_no': 'XYZ789',
            'email': 'updated@example.com',
            'verified': 'no',
        }

        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_update_feedback_invalid_data(self):
        url = reverse('update_feedback', args=[self.feedback.id])
        data = {
            'feedback_value_1': '1',
            'feedback_value_2': '0',
            'feedback_value_3': '2',
            'feedback_value_4': '1',
            'feedback_value_5': '0',
            'date': date(2023, 11, 24),
            'passenger_name': 'Updated Name',
            'mobile_no': '98765210',    # Invalid mobile number
            'ticket_no': 'XYZ789',
            'email': 'updated@example.com',
            'verified': 'no',
        }

        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_update_feedback_unauthorized_role(self):
        url = reverse('update_feedback', args=[self.feedback.id])
        data = {
            'feedback_value_1': '1',
            'feedback_value_2': '0',
            'feedback_value_3': '2',
            'feedback_value_4': '1',
            'feedback_value_5': '0',
            'date': date(2023, 11, 24),
            'passenger_name': 'Updated Name',
            'mobile_no': '9876543210',
            'ticket_no': 'XYZ789',
            'email': 'updated@example.com',
            'verified': 'no',
        }

        response = self.client2.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_delete_feedback(self):
        url = reverse('delete_feedback', args=[self.feedback.id])
        response = self.client.delete(url)
        # print(response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_delete_feedback_unauthorized_role(self):
        url = reverse('delete_feedback', args=[self.feedback.id])
        response = self.client2.delete(url)
        # print(response.data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
