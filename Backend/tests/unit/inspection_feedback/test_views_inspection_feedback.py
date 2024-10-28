from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date

from tests.setup import TestObjectFactory
from inspection_feedback.models import Inspection_feedback


class InspectionFeedbackApiTestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()
        self.date = date.today()

        self.admin = factory.create_role("railway admin")
        self.supervisor_role = factory.create_role("supervisor")
        self.unauthorized_role = factory.create_role("unauthorized")

        self.station = factory.create_station('Test Station', 1, 2)
        self.station2 = factory.create_station('Test Station2', 2, 2)

        self.user = factory.create_user("testuser", 'test@email.com', self.supervisor_role, self.station, '1234567891')
        self.user.set_password('testpassword')
        self.user.save()
        self.admin_user = factory.create_user("testuser3", 'test3@email.com', self.admin, self.station, '1234567892')
        self.unauthorized_user = factory.create_user("testuser2", 'test2@email.com', self.unauthorized_role, self.station, '1234567890')

        factory.create_assign_permission(self.user)
        factory.create_assign_permission(self.unauthorized_user)

        access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.admin_user)
        access_token3 = factory.generate_token(self.unauthorized_user)

        self.client = APIClient()
        self.admin_client = APIClient()
        self.unauthorized_client = APIClient()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')
        self.unauthorized_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token3}')

        Inspection_feedback.objects.create(
            rating='Excellent',
            date='2023-12-11',
            remarks='Test Remarks',
            user=self.user,
            station=self.station
        )


    def test_inspection_feedback(self):
        url = reverse('inspection_feedback')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_inspection_feedback_unauthorized(self):
        url = reverse('inspection_feedback')

        response = self.unauthorized_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = "UNAUTHORIZED doesn't have permission to view this page!"
        self.assertEqual(response.data['detail'], expected_msg)


    def test_inspection_feedback_api_create(self):
        url = reverse('add_inspection_feedback')

        data = {
            'rating': 'Excellent',
            'date': self.date,
            'remarks': 'Test Remarks',
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expected_msg = 'Inspection Feedback is created'
        self.assertEqual(response.data['message'], expected_msg)


    def test_inspection_feedback_api_update(self):
        url = reverse('add_inspection_feedback')

        data = {
            'rating': 'Poor',
            'date': '2023-12-11',
            'remarks': 'Test Remarks2',
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Inspection Feedback is updated'
        self.assertEqual(response.data['message'], expected_msg)


    def test_inspection_feedback_api_invalid_data(self):
        url = reverse('add_inspection_feedback')

        data = {
            'rating': 'Excellent',
            'date': '14/12/2023',   # Invalid date format
            'remarks': 'Test Remarks',
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_inspection_feedback_api_missing_data(self):
        url = reverse('add_inspection_feedback')

        data = {
            'rating': 'Excellent',
            # missing date
            'remarks': 'Test Remarks',
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: date'
        self.assertEqual(response.data['message'], expected_msg)


    def test_inspection_feedback_api_unauthorized(self):
        url = reverse('add_inspection_feedback')

        data = {
            'rating': 'Excellent',
            'date': self.date,
            'remarks': 'Test Remarks',
        }
        
        response = self.unauthorized_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = 'Permission Denied'
        self.assertEqual(response.data['message'], expected_msg)
