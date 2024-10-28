from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date

from tests.setup import TestObjectFactory
from ratings.models import Rating


class RatingAPITestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()
        self.date = date.today()

        self.user_type = factory.create_role("supervisor")
        self.admin = factory.create_role("railway admin")
        self.unauthorized_role = factory.create_role("unauthorized")

        self.station = factory.create_station('Test Station', 1, 2)
        self.station2 = factory.create_station('Test Station2', 2, 2)

        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        self.user2 = factory.create_user("testuser2", 'test2@email.com', self.unauthorized_role, self.station, '1234567890')
        self.user3 = factory.create_user("testuser3", 'test3@email.com', self.user_type, self.station, '1234567892')

        factory.create_assign_permission(self.user)
        factory.create_assign_permission(self.user2)

        self.task = factory.create_task(1, 'test desc', self.station, 730, 1)
        self.shift1 = factory.create_shift(1, self.station, "06:00:00", "14:00:00")
        self.shift2 = factory.create_shift(2, self.station, "14:00:00", "22:00:00")
        self.shift3 = factory.create_shift(3, self.station, "22:00:00", "06:00:00")

        self.task_shift_occur_id = factory.create_task_shift_occurrence(self.task, self.shift1)
        self.pax1 = factory.create_pax(10, self.date, self.shift1, self.user)
        self.pax1 = factory.create_pax(15, self.date, self.shift2, self.user)
        self.pax1 = factory.create_pax(20, self.date, self.shift3, self.user)

        access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.user2)
        access_token3 = factory.generate_token(self.user3)

        self.client = APIClient()
        self.client2 = APIClient()
        self.client3 = APIClient()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')
        self.client3.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token3}')

        self.rating = Rating.objects.create(
            rating_value=4,
            date=self.date,
            task_shift_occur_id=self.task_shift_occur_id,
            task_status='pending',
            user=self.user,
            created_by=self.user,
            updated_by=self.user
        )


    def test_create_rating(self):
        url = reverse(
            'create_rating', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )

        data = {
            'rating_value': '4',
            'task_status': 'pending',
            'date': self.date
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


    def test_create_rating_invalid_data(self):
        url = reverse(
            'create_rating', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )

        data = {
            'rating_value': '4',
            'task_status': 'pending',
            # Date missing
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_create_rating_unauthorized(self):
        url = reverse(
            'create_rating', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )

        data = {
            'rating_value': '4',
            'task_status': 'pending',
            'date': self.date
        }
        
        response = self.client2.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_rating_not_found(self):
        url = reverse(
            'create_rating', 
            args=[999, 999, 999]    # Non-existing IDs
            )

        data = {
            'rating_value': '4',
            'task_status': 'pending',
            'date': self.date
        }
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_get_rating(self):
        url = reverse(
            'get_rating', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )
        
        response = self.client.get(url, {'date': self.date})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_get_rating_no_rating(self):
        url = reverse(
            'get_rating', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )
        
        response = self.client.get(url, {'date': '2023-11-29'})     # Date with no ratings
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


    def test_get_rating_missing_date(self):
        url = reverse(
            'get_rating', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )
        
        response = self.client.get(url, {})     # Missing date
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Data missing: date')


    def test_get_rating_not_found(self):
        url = reverse(
            'get_rating', 
            args=[999, 999, 999]    # Non-existing IDs
            )
        
        response = self.client.get(url, {'date': self.date})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_update_rating(self):
        url = reverse('update_rating', args=[self.rating.id])

        data = {
            'rating_value': '4',
            'task_status': 'completed'
        }
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_update_rating_rating_not_exist(self):
        url = reverse('update_rating', args=[999])  # Non-existing ID

        data = {
            'rating_value': '4',
            'task_status': 'completed'
        }
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_update_rating_unauthorized(self):
        url = reverse('update_rating', args=[self.rating.id])

        data = {
            'rating_value': '4',
            'task_status': 'completed'
        }
        
        response = self.client2.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_update_rating_invalid_data(self):
        url = reverse('update_rating', args=[self.rating.id])

        data = {
            'rating_value': '3',
            'task_status': 'abcd'   # Invalid task_status
        }
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_task_status_update(self):
        url = reverse(
            'update_rating_status', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )

        data = {
            'date': self.date,
            'task_status': 'completed'
        }
        self.user.user_type = self.admin
        self.user.save()
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_task_status_update_not_exist(self):
        url = reverse('update_rating_status', args=[999, 999, 999])  # Non-existing IDs

        data = {
            'date': self.date,
            'task_status': 'completed'
        }
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_task_status_update_unauthorized(self):
        url = reverse(
            'update_rating_status', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )

        data = {
            'date': self.date,
            'task_status': 'completed'
        }
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_task_status_update_invalid_data(self):
        url = reverse(
            'update_rating_status', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )

        data = {
            'date': self.date,
            'task_status': 'abcde'  # Invalid data
        }
        self.user.user_type = self.admin
        self.user.save()
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_task_status_update_missing_data(self):
        url = reverse(
            'update_rating_status', 
            args=[self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id]
            )

        data = {
            # missing date
            'task_status': 'completed'
        }
        self.user.user_type = self.admin
        self.user.save()
        
        response = self.client.put(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Data missing: date')
