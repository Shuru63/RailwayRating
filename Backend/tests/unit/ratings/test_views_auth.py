from aiohttp import request
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from django.http import HttpRequest
from django.core import mail
from datetime import timedelta

from tests.setup import TestObjectFactory
from ratings.models import Rating
from user_onboarding.models import OTP


class RatingsAuthTestCase(TestCase):
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

        self.otp = OTP.objects.create(
            email = 'test@email.com',
            otp = '123456',
        )


    def test_verify_signature_email(self):
        url = reverse('verify_signature_email')

        response = self.client.post(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Verify Your Email')


    def test_verify_signature_email_unauthenticated(self):
        url = reverse('verify_signature_email')
        self.client.logout()

        response = self.client.post(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_confirm_signature_email_success(self):
        url = reverse('confirm_signature_email')

        data = {
            'otp': '123456',
            'currShift': 1,
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_confirm_signature_email_unauthenticated(self):
        url = reverse('confirm_signature_email')
        self.client.logout()

        data = {
            'otp': '123456',
            'currShift': 1,
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_confirm_signature_email_incorrect_otp(self):
        url = reverse('confirm_signature_email')

        data = {
            'otp': '654321',    # Incorrect OTP
            'currShift': 1,
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_invalid_otp_length(self):
        url = reverse('confirm_signature_email')

        data = {
            'otp': '111111111',    # Invalid OTP
            'currShift': 1,
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_expired_otp(self):
        url = reverse('confirm_signature_email')

        data = {
            'otp': '123456',
            'currShift': 1,
            'date': self.date
        }
        self.otp.counter = 3
        self.otp.save()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_missing_data(self):
        url = reverse('confirm_signature_email')

        data = {
            # No OTP
            'currShift': 1,
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Data missing: otp')


    def test_confirm_signature_email_otp_not_found(self):
        url = reverse('confirm_signature_email')

        data = {
            'otp': '123456',
            'currShift': 1,
            'date': self.date
        }
        self.otp.delete()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    
    def test_confirm_signature_email_feedback_summary_success(self):
        url = reverse('confirm_signature_email_feedback_summary')

        data = {
            'otp': '123456',
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_confirm_signature_email_feedback_summary_unauthenticated(self):
        url = reverse('confirm_signature_email_feedback_summary')
        self.client.logout()

        data = {
            'otp': '123456',
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_confirm_signature_email_feedback_summary_incorrect_otp(self):
        url = reverse('confirm_signature_email_feedback_summary')

        data = {
            'otp': '654321',
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_feedback_summary_invalid_otp_length(self):
        url = reverse('confirm_signature_email_feedback_summary')

        data = {
            'otp': '111111111',    # Invalid OTP
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_feedback_summary_expired_otp(self):
        url = reverse('confirm_signature_email_feedback_summary')

        data = {
            'otp': '123456',
            'date': self.date
        }
        self.otp.counter = 3
        self.otp.save()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_feedback_summary_missing_data(self):
        url = reverse('confirm_signature_email_feedback_summary')

        data = {
            # No OTP
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Data missing: otp')


    def test_confirm_signature_email_feedback_summary_otp_not_found(self):
        url = reverse('confirm_signature_email_feedback_summary')

        data = {
            'otp': '123456',
            'date': self.date
        }
        self.otp.delete()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


        
    def test_confirm_signature_email_daily_eval_success(self):
        url = reverse('confirm_signature_email_daily_eval')

        data = {
            'otp': '123456',
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_confirm_signature_email_daily_eval_unauthenticated(self):
        url = reverse('confirm_signature_email_daily_eval')
        self.client.logout()

        data = {
            'otp': '123456',
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_confirm_signature_email_daily_eval_incorrect_otp(self):
        url = reverse('confirm_signature_email_daily_eval')

        data = {
            'otp': '654321',
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_daily_eval_invalid_otp_length(self):
        url = reverse('confirm_signature_email_daily_eval')

        data = {
            'otp': '111111111',    # Invalid OTP
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_daily_eval_expired_otp(self):
        url = reverse('confirm_signature_email_daily_eval')

        data = {
            'otp': '123456',
            'date': self.date
        }
        self.otp.counter = 3
        self.otp.save()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_confirm_signature_email_daily_eval_missing_data(self):
        url = reverse('confirm_signature_email_daily_eval')

        data = {
            # No OTP
            'date': self.date
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Data missing: otp')


    def test_confirm_signature_email_daily_eval_otp_not_found(self):
        url = reverse('confirm_signature_email_daily_eval')

        data = {
            'otp': '123456',
            'date': self.date
        }
        self.otp.delete()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
