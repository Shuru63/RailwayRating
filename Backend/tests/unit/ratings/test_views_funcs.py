from aiohttp import request
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from django.http import HttpRequest

from tests.setup import TestObjectFactory
from ratings.models import Rating
from website.utils import add_cycle


class RatingsFuncsTest(TestCase):
    def setUp(self):
        factory = TestObjectFactory()
        self.date = date.today()

        self.user_type = factory.create_role("supervisor")
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

        Rating.objects.create(
            rating_value=4,
            date=self.date,
            task_shift_occur_id=self.task_shift_occur_id,
            task_status='pending'
        )


    def test_enable_task_alternately(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            # 'day': 1,
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'A' # Alternate day
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_weekly(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            'day': 4,   # Friday
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'W' # Weekly
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_fortnightly(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            'day': 2,   # Friday
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'F' # Fortnightly
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_biannually(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            # 'day': 2,
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'B' # Biannually
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_half_yearly(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            # 'day': 2,
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'H' # Half Yearly
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_quaterly(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            # 'day': 2,
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'Q' # Quaterly
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_biweekly(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            'day': 3,   # Thursday
            'bwday': 2,
        }
        self.task.cleaning_cycle_type = 'BW' # Weekly
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    

    def test_enable_task_monthly(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            # 'day': 2,
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'M' # Monthly
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_yearly(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            # 'day': 2,
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'Y' # Yearly
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_unauthorized(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            'day': 3,   # Thursday
            'bwday': 2,
        }
        self.task.cleaning_cycle_type = 'BW' # Weekly
        self.task.save()

        response = self.client2.post(url, data)  # Unauthorized client
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_enable_task_delete_cycle(self):
        url = reverse('enable_task')
        request = HttpRequest()
        request.user = self.user

        data = {
            'date': self.date,
            'action': 'D',
            'task_id': self.task.task_id,
            # 'day': 2,
            # 'bwday': 4,
        }
        self.task.cleaning_cycle_type = 'B' # Biannually
        self.task.save()
        add_cycle(request, self.date, self.task)

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_task_task_not_exist(self):
        url = reverse('enable_task')

        data = {
            'date': self.date,
            'action': 'E',
            'task_id': self.task.task_id,
            'day': 1,
            'bwday': 4,
        }
        self.user.station = self.station2
        self.user.save()
        self.task.cleaning_cycle_type = 'A' # Alternate Task
        self.task.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_prev_page_url(self):
        url = reverse('prev_page_url')

        data = {
            'prev_page': 'Today',
            'date': self.date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_prev_page_url_missing_data(self):
        url = reverse('prev_page_url')

        data = {
            'prev_page': 'Today',
            # Missing date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_task_description(self):
        url = reverse('task_description')

        data = {
            'task': self.task.task_id,
            'shift': self.shift1.shift_id,
            'occurrence': self.task_shift_occur_id.occurrence_id,
            'station': self.station.station_name,
            'date': self.date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_task_description_station_not_exist(self):
        url = reverse('task_description')

        data = {
            'task': self.task.task_id,
            'shift': self.shift1.shift_id,
            'occurrence': self.task_shift_occur_id.occurrence_id,
            'station': 999, # Non-existing station
            'date': self.date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_task_description_task_not_exist(self):
        url = reverse('task_description')

        data = {
            'task': 999,    # Non-existing task
            'shift': self.shift1.shift_id,
            'occurrence': self.task_shift_occur_id.occurrence_id,
            'station': self.station.station_name, 
            'date': self.date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_task_description_shift_not_exist(self):
        url = reverse('task_description')

        data = {
            'task': self.task.task_id,
            'shift': 999,   # Non-existing shift
            'occurrence': self.task_shift_occur_id.occurrence_id,
            'station': self.station.station_name, 
            'date': self.date
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
