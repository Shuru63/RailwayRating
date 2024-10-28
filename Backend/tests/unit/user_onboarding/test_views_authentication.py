from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from unittest.mock import patch
from rest_framework_simplejwt.tokens import RefreshToken

from tests.setup import TestObjectFactory
from user_onboarding.models import OTP


class AuthenticationViewTestCase(TestCase):
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

        self.mobile_otp = OTP.objects.create(
            phone=self.user.phone,
            otp='123456',
            session_id = 'test_session_id',
            data='Testnew@123'
            )


    def test_user_login_view(self):
        url = reverse('login')
        self.client.logout()
        data = {
            'phone': self.user.phone,
            'password': 'testpassword',
            'user_type': self.supervisor_role.id,
            'station': self.station.station_code,
            }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access_token' in response.data)


    def test_user_logout_view(self):
        url = reverse('logout')

        refresh_token = RefreshToken.for_user(self.user)
        access_token = refresh_token.access_token
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        data = {
            'refresh_token': str(refresh_token)
        }

        response = client.delete(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Successfully logged out'
        self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_send(self):
        url = reverse('login_using_otp_send')
        self.client.logout()

        data = {
            'phone_number': self.user.phone,
        }
        with patch('user_onboarding.views.authentication.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_msg = 'OTP request sent successfully. Please check your phone.'
            self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_send_invalid_user(self):
        url = reverse('login_using_otp_send')
        self.client.logout()
        invalid_phone = '9876543210'

        data = {
            'phone_number': invalid_phone,
        }

        response = self.client.post(url, data, format='json')
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'User not found'
        self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_send_fail(self):
        url = reverse('login_using_otp_send')
        self.client.logout()
        data = {
            'phone_number': self.user.phone
        }
        with patch('user_onboarding.views.authentication.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = False
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            expected_msg = 'Failed to send OTP request. Please check your number.'
            self.assertEqual(response.data['message'], expected_msg)        


    def test_login_using_otp_send_invalid_phone(self):
        url = reverse('login_using_otp_send')
        self.client.logout()

        data = {
            'phone_number': '998877'   # Invalid mobile number
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Phone number must be exactly 10 digits'
        self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_verify_success(self):
        url = reverse('login_using_otp_verify')
        self.client.logout()

        data = {
            'login_code': self.mobile_otp.otp,
            'phone': self.mobile_otp.phone,
        }
        
        with patch('user_onboarding.otp_auth.verify_otp') as mocked_verify_otp:
            mocked_verify_otp.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_msg = 'Logged in successfully'
            self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_verify_fail(self):
        url = reverse('login_using_otp_verify')
        self.client.logout()

        data = {
            'login_code': self.mobile_otp.otp,
            'phone': self.mobile_otp.phone,
        }
        
        with patch('user_onboarding.views.authentication.verify_otp') as mocked_verify_otp:
            mocked_verify_otp.return_value = False
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            expected_msg = 'Incorrect OTP'
            self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_verify_expired_otp(self):
        url = reverse('login_using_otp_verify')
        self.client.logout()

        data = {
            'login_code': '123456',
            'phone': self.user.phone
        }

        self.mobile_otp.counter = 3
        self.mobile_otp.save()
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'OTP has expired. Please generate a new OTP.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_invalid_method(self):
        url = reverse('login')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


    def test_login_using_otp_verify_user_not_found(self):
        url = reverse('login_using_otp_verify')
        self.mobile_otp.phone = '9876543210'
        self.mobile_otp.save()
        data = {
            'login_code': '123456',
            'phone': self.mobile_otp.phone,
        }
        with patch('user_onboarding.otp_auth.verify_otp') as mocked_verify_otp:
            mocked_verify_otp.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
            expected_msg = 'User not found'
            self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_verify_missing_session_id(self):
        url = reverse('login_using_otp_verify')
        self.mobile_otp.session_id = None
        self.mobile_otp.save()
        data = {
            'login_code': '123456',
            'phone': self.mobile_otp.phone,
        }
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Missing Session ID'
        self.assertEqual(response.data['message'], expected_msg)


    def test_login_using_otp_verify_server_error(self):
        url = reverse('login_using_otp_verify')
        data = {}
        with self.assertRaises(Exception):
            response = self.client.post(url, data)
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)