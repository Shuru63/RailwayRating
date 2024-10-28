from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from unittest.mock import patch
from django.core import mail

from tests.setup import TestObjectFactory
from user_onboarding.models import OTP, RequestUser


class RequestUserTestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()
        self.date = date.today()

        self.user_type = factory.create_role("supervisor")
        self.admin = factory.create_role("railway admin")
        self.unauthorized_role = factory.create_role("unauthorized")

        self.station = factory.create_station('Test Station', 1, 2)
        self.station2 = factory.create_station('Test Station2', 2, 2)

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

        self.email_otp = OTP.objects.create(
            email=self.user.email,
            otp='123456',
            data='Testnew@123'
            )

        self.mobile_otp = OTP.objects.create(
            phone=self.user.phone,
            otp='123456',
            session_id = 'test_session_id',
            data='Testnew@123'
            )

        self.req_user = RequestUser.objects.create(
            user_email='request@email.com',
            user_phone='7766554433',
            user_station=self.station.station_code,
            user_type=self.user_type.name
        )
        

    def test_verify_email(self):
        url = reverse('verify_email')

        data = {
            'email': 'testverify@email.com'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Email sent successfully, Please check your Email')
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Verify Your Email')


    def test_verify_email_missing_data(self):
        url = reverse('verify_email')

        data = {
            # missing email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_verify_email_request_pending(self):
        url = reverse('verify_email')

        data = {
            'email': self.req_user.user_email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_102_PROCESSING)
        expected_msg = 'Your Sign Up request is pending! Please wait for some time.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_verify_email_email_exist(self):
        url = reverse('verify_email')

        data = {
            'email': self.user.email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        expected_msg = 'Email Already Exist!'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_email(self):
        url = reverse('confirm_email')

        data = {
            'email': self.email_otp.email,
            'otp': self.email_otp.otp
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'OTP Verified'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_email_invalid_email(self):
        url = reverse('confirm_email')

        data = {
            'otp': '123456',
            'email': 'invalidemaildotcom'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Invalid Email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_email_incorrect_otp(self):
        url = reverse('confirm_email')

        data = {
            'otp': '654321',    # Incorrect OTP
            'email': self.user.email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Incorrect OTP'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_email_not_found(self):
        url = reverse('confirm_email')

        data = {
            'otp': '123456',
            'email': self.user.email
        }

        self.email_otp.delete()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'OTP not found. Please generate a new OTP.'
        self.assertEqual(response.data['message'], expected_msg)

    
    def test_confirm_email_missing_data(self):
        url = reverse('confirm_email')

        data = {
            'otp': '123456',
            # missing email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_verify_phone_success(self):
        url = reverse('verify_phone')

        data = {
            'phone': '1122334455'
        }

        with patch('user_onboarding.views.request_user.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_msg = 'OTP request sent successfully. Please check your phone.'
            self.assertEqual(response.data['message'], expected_msg)


    def test_verify_phone_fail(self):
        url = reverse('verify_phone')

        data = {
            'phone': '1122334455'
        }

        with patch('user_onboarding.views.request_user.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = False
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            expected_msg = 'Failed to send OTP request. Please check your Number'
            self.assertEqual(response.data['message'], expected_msg)


    def test_verify_phone_invalid_phone(self):
        url = reverse('verify_phone')

        data = {
            'phone': '998877'   # Invalid mobile number
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Phone number must be exactly 10 digits'
        self.assertEqual(response.data['message'], expected_msg)


    def test_verify_phone_existing_number(self):
        url = reverse('verify_phone')

        data = {
            'phone': self.user.phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        expected_msg = 'Number already registered'
        self.assertEqual(response.data['message'], expected_msg)


    def test_verify_phone_request_pending(self):
        url = reverse('verify_phone')

        data = {
            'phone': self.req_user.user_phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Your Sign Up request is pending! Please wait for some time.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_verify_phone_missing_phone(self):
        url = reverse('verify_phone')

        data = {
            # Missing phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: phone'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_phone_ver(self):
        url = reverse('confirm_phone_ver')

        data = {
            'otp': '123456',
            'phone': self.user.phone
        }

        with patch('user_onboarding.otp_auth.verify_otp') as mocked_verify_otp:
            mocked_verify_otp.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_msg = 'OTP Verified'
            self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_phone_ver_incorrect_otp(self):
        url = reverse('confirm_phone_ver')

        data = {
            'otp': '654321',
            'phone': self.user.phone
        }

        with patch('user_onboarding.otp_auth.verify_otp') as mocked_verify_otp:
            mocked_verify_otp.return_value = False
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            expected_msg = 'Incorrect OTP'
            self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_phone_ver_missing_data(self):
        url = reverse('confirm_phone_ver')

        data = {
            # missing OTP
            'phone': self.user.phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: otp'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_phone_ver_otp_not_found(self):
        url = reverse('confirm_phone_ver')
        self.mobile_otp.delete()

        data = {
            'otp': '123456',
            'phone': self.user.phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'OTP not found. Please generate a new OTP.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_phone_ver_invalid_phone(self):
        url = reverse('confirm_phone_ver')

        data = {
            'phone': '998877',   # Invalid mobile number
            'otp': self.mobile_otp.otp
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Phone number must be exactly 10 digits'
        self.assertEqual(response.data['message'], expected_msg)


    def test_show_requested_user(self):
        url = reverse('show_requested_user')

        response = self.admin_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_show_requested_user_unauthorized_user(self):
        url = reverse('show_requested_user')

        response = self.unauthorized_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = "UNAUTHORIZED doesn't have permission to view this page!"
        self.assertEqual(response.data['detail'], expected_msg)


    def test_user_requested_approved(self):
        url = reverse('user_requested', args=[self.req_user.id])

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User Approved')
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'User Request Approved')


    def test_user_requested_denied(self):
        url = reverse('user_requested', args=[self.req_user.id])

        data = {
            'q': 'DENY'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User Denied')


    def test_user_requested_user_not_found(self):
        url = reverse('user_requested', args=[999])     # Non-existing ID

        data = {
            'q': 'APPROVE'
        }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'User does not exist'
        self.assertEqual(response.data['message'], expected_msg)


    def test_user_requested_station_not_found(self):
        url = reverse('user_requested', args=[self.req_user.id])

        data = {
            'q': 'APPROVE'
        }
        self.req_user.user_station = 999
        self.req_user.save()

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'Station matching query does not exist.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_user_requested_unauthorized_user(self):
        url = reverse('user_requested', args=[self.req_user.id])

        data = {
            'q': 'APPROVE'
        }

        response = self.unauthorized_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_msg = "UNAUTHORIZED doesn't have permission to view this page!"
        self.assertEqual(response.data['detail'], expected_msg)


    def test_enable_disable_user_post(self):
        url = reverse('enable_disable_user')

        data = {
            'testuser': 'enabled',
            'testuser2': 'disabled',
            'testuser3': 'enabled'
            }

        response = self.admin_client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_enable_disable_user_get(self):
        url = reverse('enable_disable_user')

        response = self.admin_client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

