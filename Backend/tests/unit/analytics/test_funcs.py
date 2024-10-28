from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from tests.setup import TestObjectFactory


class AnalyticsTestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()

        self.user_type = factory.create_role("supervisor")
        self.station = factory.create_station('Test Station', 1, 2)
        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        factory.create_assign_permission(self.user)

        access_token = factory.generate_token(self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')


    def test_handle_graph_with_valid_data(self):
        post_data = {
            'start_date': '2023-01-01', 
            'end_date': '2023-01-10',
            'user': str(self.user.id),  
            'task': '1,2,3',  
            'rating_value': '1,2,3', 
            'station_value': str(self.station.id),
        }

        response = self.client.post(reverse('analytics'), post_data)
        # print(response.data)

        self.assertEqual(response.status_code, 200)


    def test_handle_graph_unauthenticated(self):
        self.client.logout()

        post_data = {
            'start_date': '2023-01-01', 
            'end_date': '2023-01-10',
            'user': str(self.user.id),  
            'task': '1,2,3',  
            'rating_value': '1,2,3', 
            'station_value': str(self.station.id),
        }

        response = self.client.post(reverse('analytics'), post_data)
        # print(response.data)

        self.assertIn(response.status_code, [302, 401])


    # Test if the analytics endpoint handles invalid start date correctly.
    def test_handle_graph_with_invalid_start_date(self):
        # self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        post_data = {
            'start_date': '2024-01-01',  # Invalid start date
            'end_date': '2023-01-10',
            'user': str(self.user.id),  
            'task': '1,2,3',  
            'rating_value': '1,2,3', 
            'station_value': str(self.station.id),
        }

        response = self.client.post(reverse('analytics'), post_data)
        # print(response.data['message'])

        self.assertNotEqual(response.status_code, 200)


    # Test if the analytics endpoint handles invalid end date correctly.
    def test_handle_graph_with_invalid_end_date(self):
        post_data = {
            'start_date': '2023-01-01', 
            'end_date': '2022-01-10',  # Invalid end date
            'user': str(self.user.id),  
            'task': '1,2,3',  
            'rating_value': '1,2,3', 
            'station_value': str(self.station.id),
        }

        response = self.client.post(reverse('analytics'), post_data)
        # print(response.data['message'])

        self.assertNotEqual(response.status_code, 200)


    # Test if the analytics endpoint handles missing user correctly.
    def test_handle_graph_with_missing_user(self):
        post_data = {
            'start_date': '2023-01-01', 
            'end_date': '2023-01-10',
            # Missing 'user'
            'task': '1,2,3',  
            'rating_value': '1,2,3', 
            'station_value': str(self.station.id),
        }

        response = self.client.post(reverse('analytics'), post_data)
        # print(response.data['message'])

        self.assertNotEqual(response.status_code, 200)
