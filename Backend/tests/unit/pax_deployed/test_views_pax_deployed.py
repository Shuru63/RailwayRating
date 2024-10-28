from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

from pax_deployed.models import Pax
from tests.setup import TestObjectFactory


class PaxAPITestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()

        self.user_type = factory.create_role("supervisor")
        self.unauthorized_role = factory.create_role("unauthorized")
        self.station = factory.create_station('Test Station', 1, 2)
        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        self.user2 = factory.create_user("testuser2", 'test2@email.com', self.unauthorized_role, self.station, '1234567890')
        factory.create_assign_permission(self.user)
        factory.create_assign_permission(self.user2)
        self.shift = factory.create_shift(1, self.station, "22:00:00", "06:00:00")

        # Create a sample Pax instance
        self.pax = Pax.objects.create(
            count=10,
            date='2023-11-27',
            shift=self.shift,
            user=self.user,
            created_by='Test User',
            updated_by='Test User',
            Pax_status='pending'
        )

        access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.user2)
        self.client = APIClient()
        self.client2 = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')


    def test_create_pax(self):
        url = reverse('add_pax', args=['2023-11-27', 1])
        data = {
            'count': 5,
            'status': 'pending'
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


    def test_create_pax_missing_count(self):
        url = reverse('add_pax', args=['2023-11-27', 1])
        data = {
            'status': 'pending'
            # Missing 'count' field
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_create_pax_missing_status(self):
        url = reverse('add_pax', args=['2023-11-27', 1])
        data = {
            'count': 5
            # Missing 'status' field
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_message = 'Data missing: status'
        self.assertEqual(response.data['message'], expected_message)


    def test_post_pax_unauthorized(self):
        url = reverse('add_pax', args=['2023-11-27', self.shift.shift_id])
        post_data = {
            'count': 10,
            'status': 'pending',
        }
        response = self.client2.post(url, post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_update_pax(self):
        url = reverse('update_pax_value', args=[self.pax.id])
        data = {
            'count': 15,
            'Pax_status': 'submit',
        }

        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_update_pax_missing_count(self):
        url = reverse('update_pax_value', args=[self.pax.id])
        data = {
            # Missing 'count' field
        }

        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_update_pax_invalid_id(self):
        url = reverse('update_pax_value', args=[999])   # Invalid ID
        data = {
            'count': 7,
        }

        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_update_pax_unauthorized(self):
        url = reverse('update_pax_value', args=[self.pax.id])
        data = {
            'count': 15,
            'Pax_status': 'submit',
        }

        
        response = self.client2.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_fetch_pax(self):
        url = reverse('fetch_pax', args=['2023-11-27'])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_fetch_pax_no_data(self):
        url = reverse('fetch_pax', args=['2023-11-30'])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['paxs'], [])


    def test_fetch_pax_unauthorized(self):
        url = reverse('fetch_pax', args=['2023-11-27'])

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
