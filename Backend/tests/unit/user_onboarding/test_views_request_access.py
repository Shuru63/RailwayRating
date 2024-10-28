from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from django.core import mail

from tests.setup import TestObjectFactory
from user_onboarding.models import RequestAccess


class RequestUserTestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()
        self.date = date.today()

        self.user_type = factory.create_role("supervisor")
        self.admin = factory.create_role("railway admin")
        self.unauthorized_role = factory.create_role("unauthorized")

        self.station = factory.create_station('Test Station', 1, 2)
        self.station2 = factory.create_station('Test Station2', 2, 2)
        self.station3 = factory.create_station('Test Station3', 3, 2)

        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
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

        self.req_access = RequestAccess.objects.create(
            user_email='request@email.com',
            user_phone=self.user.phone,
            user_station=self.station.station_code,
            user_type=self.user_type.name,
            from_for_station=str(self.date),
            to_for_station=str(self.date + timedelta(days=10))
        )
        

    def test_show_requested_access(self):
        url = reverse('show_requested_access')

        response = self.admin_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_show_requested_access_unauthorized_user(self):
        url = reverse('show_requested_access')

        response = self.unauthorized_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = "UNAUTHORIZED doesn't have permission to view this page!"
        self.assertEqual(response.data['detail'], expected_msg)


    def test_access_requested_approved(self):
        url = reverse('access_requested', args=[self.req_access.id, 'Access Station'])
        self.req_access.for_station = "['Test Station2', 'Test Station3']"
        self.req_access.save()

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'User Request Approved')


    def test_access_requested_change_station_approved(self):
        url = reverse('access_requested', args=[self.req_access.id, 'Change Station'])
        self.req_access.for_station = 'Test Station3'
        self.req_access.save()

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = "Successfully changed the user's station: Test Station to Test Station3"
        self.assertEqual(response.data['message'], expected_msg)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'User Request Approved')


    def test_access_requested_change_station_not_found(self):
        url = reverse('access_requested', args=[self.req_access.id, 'Change Station'])
        self.req_access.for_station = 'Unknown Station'
        self.req_access.save()

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'Station not found'
        self.assertEqual(response.data['message'], expected_msg)


    def test_access_requested_denied(self):
        url = reverse('access_requested', args=[self.req_access.id, 'Access Station'])
        self.req_access.for_station = "['Test Station2', 'Test Station3']"
        self.req_access.save()

        data = {
            'q': 'DENY'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Request Denied'
        self.assertEqual(response.data['message'], expected_msg)


    def test_access_requested_access_not_exist(self):
        url = reverse('access_requested', args=[999, 'Access Station'])
        self.req_access.for_station = "['Test Station2', 'Test Station3']"
        self.req_access.save()

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'Access request does not exist'
        self.assertEqual(response.data['message'], expected_msg)


    def test_access_requested_user_not_found(self):
        url = reverse('access_requested', args=[self.req_access.id, 'Access Station'])
        self.req_access.for_station = "['Test Station2', 'Test Station3']"
        self.req_access.user_phone = '3322116677'   #Non-existing user phone
        self.req_access.save()

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'User not found'
        self.assertEqual(response.data['message'], expected_msg)


    def test_access_requested_invalid_date_format(self):
        url = reverse('access_requested', args=[self.req_access.id, 'Access Station'])
        self.req_access.for_station = "['Test Station2', 'Test Station3']"
        self.req_access.from_for_station = '2023/12/05' #Invalid date
        self.req_access.save()

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        expected_msg = 'An error occurred while parsing the dates'
        self.assertEqual(response.data['message'], expected_msg)


    def test_access_requested_unauthorized(self):
        url = reverse('access_requested', args=[self.req_access.id, 'Access Station'])
        self.req_access.for_station = "['Test Station2', 'Test Station3']"
        self.req_access.save()

        data = {
            'q': 'APPROVE'
        }

        response = self.unauthorized_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = "UNAUTHORIZED doesn't have permission to view this page!"
        self.assertEqual(response.data['detail'], expected_msg)


    def test_change_accessed_station(self):
        url = reverse('change_accessed_station', args=[self.station2.station_name])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Station changed successfully to Test Station2'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_accessed_station_no_data(self):
        url = reverse('change_accessed_station', args=[' '])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'You cannot request for empty values, please provide data to request access'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_accessed_station_station_not_exist(self):
        url = reverse('change_accessed_station', args=['Unknown Station'])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'Station does not exist'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_station_admin(self):
        url = reverse('change_station', args=[self.station2.station_name])

        response = self.admin_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Station changed successfully to Test Station2'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_station_request(self):
        url = reverse('change_station', args=[self.station2.station_name])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Mail sent to admin for station change request for testuser from Test Station to Test Station2'
        self.assertEqual(response.data['message'], expected_msg)
        # self.assertEqual(len(mail.outbox), 1)
        # self.assertEqual(mail.outbox[0].subject, 'User Request Approved')


    def test_change_station_no_data(self):
        url = reverse('change_station', args=[' '])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'You cannot request for empty values, please provide data to request access'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_station_station_not_exist(self):
        url = reverse('change_station', args=['Unknown Station'])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'Station does not exist'
        self.assertEqual(response.data['message'], expected_msg)


    def test_access_station_invalid_type(self):
        url = reverse('access_station')
        station_values = {"Test Station2", "Test Station2"} #Invalid type

        data = {
            'station_value': station_values,
            'start_date': '2023-12-13',
            'end_date': '2024-05-12'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_access_station_missing_data(self):
        url = reverse('access_station')

        data = {
            # missing station_value
            'start_date': self.date,
            'end_date': str(self.date + timedelta(days=10))
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: station_value'
        self.assertEqual(response.data['message'], expected_msg)


    def test_access_station_unauthorized(self):
        url = reverse('access_station')

        data = {
            'station_value': f'{[self.station2.station_name, self.station3.station_name]}',
            'start_date': self.date,
            'end_date': str(self.date + timedelta(days=10))
        }

        response = self.unauthorized_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = "UNAUTHORIZED doesn't have permission to view this page!"
        self.assertEqual(response.data['detail'], expected_msg)


    def test_new_station_access_get(self):
        url = reverse('new_station_access')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_new_station_access_post(self):
        url = reverse('new_station_access')

        response = self.client.post(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_new_station_access_unauthorized(self):
        url = reverse('new_station_access')

        response = self.unauthorized_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = "UNAUTHORIZED doesn't have permission to view this page!"
        self.assertEqual(response.data['detail'], expected_msg)

