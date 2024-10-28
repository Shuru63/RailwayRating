from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from unittest.mock import patch
from django.core import mail

from tests.setup import TestObjectFactory
from user_onboarding.models import OTP


class PasswordResetViewTestCase(TestCase):
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

        self.token = default_token_generator.make_token(self.user)
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))


    def test_password_reset_request(self):
        url = reverse('password_reset')

        data = {
            'email': self.user.email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Password reset email sent successfully')
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Password Reset Requested')


    def test_password_reset_request_unregistered_email(self):
        url = reverse('password_reset')
        data = {'email': 'nonexistent@example.com'}

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        expected_msg = 'User not found'
        self.assertEqual(response.data['message'], expected_msg)


    def test_password_reset_request_invalid_email(self):
        url = reverse('password_reset')
        data = {'email': 'invalidemaildotcom'}

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Invalid Email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_password_reset_request_missing_email(self):
        url = reverse('password_reset')
        data = {
            # missing email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_password_reset_confirm(self):
        url = reverse('password_reset_confirm', args=[self.uid, self.token])

        data = {
            'new_password1': 'newpassword123', 
            'new_password2': 'newpassword123'
            }
        response = self.client.post(url, data, format='json')
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Password reset complete'
        self.assertEqual(response.data['message'], expected_msg)


    def test_password_reset_confirm_invalid_link(self):
        url = reverse('password_reset_confirm', args=[self.uid, 'invalid_token'])

        data = {
            'new_password1': 'newpassword123', 
            'new_password2': 'newpassword123'
            }
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'The reset password link is no longer valid!'
        self.assertEqual(response.data['message'], expected_msg)


    def test_password_reset_confirm_invalid_uid(self):
        url = reverse('password_reset_confirm', args=['invalid uid', self.token])

        data = {
            'new_password1': 'newpassword123', 
            'new_password2': 'newpassword123'
            }
        response = self.client.post(url, data, format='json')
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'The reset password link is no longer valid!'
        self.assertEqual(response.data['message'], expected_msg)
