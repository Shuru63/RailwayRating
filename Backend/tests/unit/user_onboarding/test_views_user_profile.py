from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from unittest.mock import patch
from django.core import mail

from tests.setup import TestObjectFactory
from user_onboarding.models import OTP


class UserProfileTestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()
        self.date = date.today()

        self.user_type = factory.create_role("supervisor")
        self.admin = factory.create_role("railway admin")

        self.station = factory.create_station('Test Station', 1, 2)
        self.station2 = factory.create_station('Test Station2', 2, 2)

        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        self.user3 = factory.create_user("testuser3", 'test3@email.com', self.user_type, self.station, '1234567892')

        factory.create_assign_permission(self.user)

        access_token = factory.generate_token(self.user)
        access_token3 = factory.generate_token(self.user3)

        self.client = APIClient()
        self.client3 = APIClient()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client3.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token3}')

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


    def test_profile(self):
        url = reverse('profile')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_profile_unauthenticated(self):
        url = reverse('profile')
        self.client.logout()

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_edit_profile_post(self):
        url = reverse('edit_profile')
        data = {
            'fname': 'UpdatedFirstName',
            'mname': 'UpdatedMiddleName',
            'lname': 'UpdatedLastName',
            'posts': 'Post1, Post2, Post3',
        }
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Successfully Updated Profile')


    def test_edit_profile_post_invalid_fname(self):
        url = reverse('edit_profile')
        data = {
            'fname': 'ab',  # Invalid entry
            'mname': 'UpdatedMiddleName',
            'lname': 'UpdatedLastName',
            'posts': 'Post1, Post2, Post3',
        }
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'First Name must be at least three characters!')


    def test_edit_profile_post_invalid_mname(self):
        url = reverse('edit_profile')
        data = {
            'fname': 'UpdatedFirstName',  
            'mname': '__',  # Invalid entry
            'lname': 'UpdatedLastName',
            'posts': 'Post1, Post2, Post3',
        }
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Middle Name can only contain alphabets!')


    def test_edit_profile_post_invalid_lname(self):
        url = reverse('edit_profile')
        data = {
            'fname': 'UpdatedFirstName',  
            'mname': 'UpdatedMiddleName',
            'lname': '__',  # Invalid entry
            'posts': 'Post1, Post2, Post3',
        }
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Last Name can only contain alphabets!')


    def test_edit_profile_post_missing_fields(self):
        url = reverse('edit_profile')
        data = {
            'fname': 'UpdatedFirstName',
            'mname': 'UpdatedMiddleName',
            # Missing 'lname' field
            'posts': 'Post1, Post2, Post3',
        }
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Data missing: lname')


    def test_edit_profile_get(self):
        url = reverse('edit_profile')
        
        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_change_password_mobile_otp_success(self):
        url = reverse('change_password')
        self.user.set_password('Test@123')
        self.user.save()

        data = {
            'old_password': 'Test@123',
            'new_password1': 'Testnew@123',
            'new_password2': 'Testnew@123',
            'send_otp': 'M'
        }
        with patch('user_onboarding.views.user_profile.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_change_password_mobile_otp_fail(self):
        url = reverse('change_password')
        self.user.set_password('Test@123')
        self.user.save()

        data = {
            'old_password': 'Test@123',
            'new_password1': 'Testnew@123',
            'new_password2': 'Testnew@123',
            'send_otp': 'M'
        }
        with patch('user_onboarding.views.user_profile.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = False
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_change_password_email_otp(self):
        url = reverse('change_password')
        self.user.set_password('Test@123')
        self.user.save()

        data = {
            'old_password': 'Test@123',
            'new_password1': 'Testnew@123',
            'new_password2': 'Testnew@123',
            'send_otp': 'E'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Change Your Password')


    def test_change_password_incorrect_password(self):
        url = reverse('change_password')
        self.user.set_password('Test@123')
        self.user.save()

        data = {
            'old_password': '*********',    # Incorrect password
            'new_password1': 'Testnew@123',
            'new_password2': 'Testnew@123',
            'send_otp': 'E'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Your old password was entered incorrectly. Please enter it again.'
        self.assertEqual(response.data['errors'][0], expected_msg)


    def test_change_password_password_missmatch(self):
        url = reverse('change_password')
        self.user.set_password('Test@123')
        self.user.save()

        data = {
            'old_password': 'Test@123',
            'new_password1': 'Testnew@123',
            'new_password2': 'Testnew@123456',
            'send_otp': 'E'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = "The two password fields didn't match."
        self.assertEqual(response.data['errors'][0], expected_msg)


    def test_change_password_invalid_password(self):
        url = reverse('change_password')
        self.user.set_password('Test@123')
        self.user.save()

        data = {
            'old_password': 'Test@123',
            'new_password1': 'test',
            'new_password2': 'test',
            'send_otp': 'E'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'This password is too short. It must contain at least 8 characters.'
        self.assertEqual(response.data['errors'][0], expected_msg)


    def test_change_password_missing_data(self):
        url = reverse('change_password')
        self.user.set_password('Test@123')
        self.user.save()

        data = {
            'old_password': 'Test@123',
            'new_password1': 'Testnew@123',
            'new_password2': 'Testnew@123',
            # Missing OTP method
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_change_pass_otp_mobile(self):
        url = reverse('change_pass_otp')

        data = {
            'otp': '123456'
        }

        with patch('user_onboarding.otp_auth.verify_otp') as mocked_verify_otp:
            mocked_verify_otp.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_msg = 'You have successfully changed your password. Please login with the New Password.'
            self.assertEqual(response.data['message'], expected_msg)


    def test_change_pass_otp_email(self):
        url = reverse('change_pass_otp')
        self.mobile_otp.delete()

        data = {
            'otp': '123456'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'You have successfully changed your password. Please login with the New Password.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_pass_otp_incorrect_otp(self):
        url = reverse('change_pass_otp')
        self.mobile_otp.delete()

        data = {
            'otp': '654321',    # Incorrect OTP
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_change_pass_otp_invalid_otp_length(self):
        url = reverse('change_pass_otp')
        self.mobile_otp.delete()

        data = {
            'otp': '111111111',    # Invalid OTP
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_change_pass_otp_expired_otp(self):
        url = reverse('change_pass_otp')
        self.mobile_otp.delete()

        data = {
            'otp': '123456',
            'currShift': 1,
            'date': self.date
        }
        self.email_otp.counter = 3
        self.email_otp.save()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_change_pass_otp_missing_data(self):
        url = reverse('change_pass_otp')
        self.mobile_otp.delete()

        data = {
            # No OTP
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Data missing: otp')


    def test_change_pass_otp_otp_not_found(self):
        url = reverse('change_pass_otp')
        self.mobile_otp.delete()

        data = {
            'otp': '123456',
        }
        self.email_otp.delete()
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_change_phone_success(self):
        url = reverse('change_phone')

        data = {
            'phone': '9988776655 '
        }
        with patch('user_onboarding.views.user_profile.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_msg = 'OTP sent successfully. Please check your phone.'
            self.assertEqual(response.data['message'], expected_msg)


    def test_change_phone_fail(self):
        url = reverse('change_phone')

        data = {
            'phone': '9988776655 '
        }
        with patch('user_onboarding.views.user_profile.send_otp_request') as mocked_send_otp_request:
            mocked_send_otp_request.return_value = False
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            expected_msg = 'Failed to send OTP request. Please check your Number'
            self.assertEqual(response.data['message'], expected_msg)


    def test_change_phone_invalid_phone(self):
        url = reverse('change_phone')

        data = {
            'phone': '998877'   # Invalid mobile number
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Phone number must be exactly 10 digits'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_phone_existing_number(self):
        url = reverse('change_phone')

        data = {
            'phone': self.user.phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Mobile Number Already Exist!'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_phone_missing_phone(self):
        url = reverse('change_phone')

        data = {
            # Missing phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: phone'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_change_phone(self):
        url = reverse('confirm_change_phone')

        data = {
            'otp': '123456',
            'phone': self.user.phone
        }

        with patch('user_onboarding.otp_auth.verify_otp') as mocked_verify_otp:
            mocked_verify_otp.return_value = True
            response = self.client.post(url, data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_msg = 'Mobile Number updated successfully.'
            self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_change_phone_incorrect_otp(self):
        url = reverse('confirm_change_phone')

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


    def test_confirm_change_phone_invalid_otp_length(self):
        url = reverse('confirm_change_phone')

        data = {
            'otp': '111111111',    # Invalid OTP
            'phone': self.user.phone
        }
        response = self.client.post(url, data=data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'OTP length should be 6'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_change_phone_expired_otp(self):
        url = reverse('confirm_change_phone')

        data = {
            'otp': '123456',
            'phone': self.user.phone
        }

        self.mobile_otp.counter = 3
        self.mobile_otp.save()
        
        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'OTP has expired. Please generate a new OTP.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_change_phone_missing_data(self):
        url = reverse('confirm_change_phone')

        data = {
            # missing OTP
            'phone': self.user.phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: otp'
        self.assertEqual(response.data['message'], expected_msg)


    def test_confirm_change_phone_otp_not_found(self):
        url = reverse('confirm_change_phone')
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


    def test_confirm_change_phone_missing_session_id(self):
        url = reverse('confirm_change_phone')
        self.mobile_otp.session_id = None
        self.mobile_otp.save()

        data = {
            'otp': '123456',
            'phone': self.user.phone
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Missing Session ID'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email(self):
        url = reverse('change_email')

        data = {
            'email': 'change@email.com'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Verify Your Email')


    def test_change_email_invalid_email(self):
        url = reverse('change_email')

        data = {
            'email': 'invalidemaildotcom'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Invalid Email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_email_taken(self):
        url = reverse('change_email')

        data = {
            'email': self.user.email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Email Already Taken!'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_missing_data(self):
        url = reverse('change_email')

        data = {
            # missing email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_otp(self):
        url = reverse('change_email_otp')

        data = {
            'otp': '123456',
            'email': self.user.email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_msg = 'Email ID updated successfully.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_otp_invalid_email(self):
        url = reverse('change_email_otp')

        data = {
            'otp': '123456',
            'email': 'invalidemaildotcom'
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Invalid Email'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_otp_incorrect_otp(self):
        url = reverse('change_email_otp')

        data = {
            'otp': '654321',    # Incorrect OTP
            'email': self.user.email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Incorrect OTP'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_otp_invalid_otp_length(self):
        url = reverse('change_email_otp')

        data = {
            'otp': '1111111111',    # Invalid OTP
            'email': self.user.email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'OTP length should be 6'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_otp_expired_otp(self):
        url = reverse('change_email_otp')

        data = {
            'otp': '123456',
            'email': self.user.email
        }

        self.email_otp.counter = 3
        self.email_otp.save()

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'OTP has expired. Please generate a new OTP.'
        self.assertEqual(response.data['message'], expected_msg)


    def test_change_email_otp_not_found(self):
        url = reverse('change_email_otp')

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


    def test_change_email_otp_missing_data(self):
        url = reverse('change_email_otp')

        data = {
            'otp': '123456',
            # missing email
        }

        response = self.client.post(url, data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        expected_msg = 'Data missing: email'
        self.assertEqual(response.data['message'], expected_msg)
