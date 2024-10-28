from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date

from tests.setup import TestObjectFactory
from ratings.models import Rating


class RatingsPagesTest(TestCase):
    def setUp(self):
        factory = TestObjectFactory()
        self.date = date.today()

        self.user_type = factory.create_role("supervisor")
        self.unauthorized_role = factory.create_role("unauthorized")
        self.station = factory.create_station('Test Station', 1, 2)
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

        Rating.objects.create(
            rating_value=4,
            date=self.date,
            task_shift_occur_id=self.task_shift_occur_id,
            task_status='pending'
        )


    def test_rating_today(self):
        url = reverse('ratingtoday')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_rating_today_unauthorized(self):
        url = reverse('ratingtoday')

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_rating_today_missing_permissions(self):
        url = reverse('ratingtoday')

        response = self.client3.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_read_rating_today(self):
        url = reverse('read_rating_today')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    
    def test_read_rating_today_unauthorized(self):
        url = reverse('read_rating_today')

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_read_rating_today_missing_permissions(self):
        url = reverse('read_rating_today')

        response = self.client3.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_curr_shift(self):
        url = reverse('curr_shift')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_curr_shift_unauthorized(self):
        url = reverse('curr_shift')

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_curr_shift_missing_permissions(self):
        url = reverse('curr_shift')

        response = self.client3.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_rating_on_specific_date(self):
        url = reverse('rating_on_specific_date')
        data = {
            'date': self.date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_rating_on_specific_date_unauthorized(self):
        url = reverse('rating_on_specific_date')
        data = {
            'date': self.date
        }

        response = self.client2.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_rating_on_specific_date_missing_permissions(self):
        url = reverse('rating_on_specific_date')
        data = {
            'date': self.date
        }

        response = self.client3.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_read_rating_on_specific_date(self):
        url = reverse('read_rating_on_specific_date')
        data = {
            'date': self.date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_read_rating_on_specific_date_unauthorized(self):
        url = reverse('read_rating_on_specific_date')
        data = {
            'date': self.date
        }

        response = self.client2.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_read_rating_on_specific_date_missing_permissions(self):
        url = reverse('read_rating_on_specific_date')
        data = {
            'date': self.date
        }

        response = self.client3.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_add_rating(self):
        url = reverse(
            'add_rating', 
            args=[self.date, self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_add_rating_missing_permission(self):
        url = reverse(
            'add_rating', 
            args=[self.date, self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id])

        response = self.client3.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_add_rating_unauthorized(self):
        url = reverse(
            'add_rating', 
            args=[self.date, self.task.task_id, self.shift1.shift_id, self.task_shift_occur_id.occurrence_id])

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
