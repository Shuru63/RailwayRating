from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from tests.setup import TestObjectFactory


class AnalyticsViewTestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()

        self.user_type = factory.create_role("supervisor")
        self.unauthorized_role = factory.create_role("unauthorized")
        self.station = factory.create_station('Test Station', 1, 2)
        self.user = factory.create_user(
            "testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        self.user2 = factory.create_user(
            "testuser2", 'test2@email.com', self.unauthorized_role, self.station, '1234567890')
        factory.create_assign_permission(self.user)
        factory.create_assign_permission(self.user2)

        access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.user2)
        self.client = APIClient()
        self.client2 = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')


    def test_analytics_authenticated_user(self):
        url=reverse('analytics')

        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_analytics_unauthenticated_user(self):
        self.client.logout()
        url=reverse('analytics')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_analytics_unauthorized_role(self):
        response = self.client2.get(reverse('analytics'))
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
