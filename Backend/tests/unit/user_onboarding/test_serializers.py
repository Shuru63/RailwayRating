from django.test import TestCase
from user_onboarding.serializers import RequestUserSerializer, UserLoginSerializer
from rest_framework.exceptions import ValidationError
from station.models import Station

class RequestUserSerializerTestCase(TestCase):
    def test_valid_serializer_data(self):
        data = {
            "f_name": "John",
            "m_name": "Doe",
            "l_name": "Smith",
            "email": "john@example.com",
            "phone": "1234567890",
            "password": "secret_password",
            "re_password": "secret_password",
            "user_type": "1",  # User type ID
            "station": 123,  # Station code
            "posts": "Example Post",
        }

        serializer = RequestUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    # def test_invalid_serializer_data(self):
    #     data = {
    #         "f_name": "John",
    #         "m_name": "Doe",
    #         "l_name": "Smith",
    #         "email": "john@example.com",
    #         "phone": "1234567890",
    #         "password": "password1",
    #         "re_password": "password2",  # Passwords do not match
    #         "user_type": "0",  # Invalid user type
    #         "station": 123,  # Invalid station code
    #         "posts": "Example Post",
    #     }

    #     serializer = RequestUserSerializer(data=data)
    #     self.assertFalse(serializer.is_valid())

    #     expected_error = ['Passwords Do not Match!']  # Ensure the error message is an exact match
    #     self.assertEqual(serializer.errors.get("re_password"), expected_error)
    
    def test_save_method(self):
        # chi = Station.objects.create()  # Replace with the actual model you have as the foreign key reference

        station = Station.objects.create(station_code="123", station_name="Test Station", chi_id=1)




        data = {
            "f_name": "John",
            "l_name": "Doe",
            "email": "johndoe@example.com",
            "phone": "1234567890",
            "password": "secretpassword",
            "re_password": "secretpassword",
            "user_type": "1",
            "station": "123",
            "posts": "Some posts",
        }

        serializer = RequestUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())

        user = serializer.save()
        # You can update this based on your expected behavior.
        # User type and Station objects will need to be created for testing.

class UserLoginSerializerTestCase(TestCase):
    # def test_valid_login_serializer(self):
    #     data = {
    #         "phone": "1234567890",
    #         "password": "secret_password",
    #         "user_type": "1",  # User type ID
    #         "station": "123",  # Station code
    #     }

    #     serializer = UserLoginSerializer(data=data, context={'request': None})
    #     self.assertTrue(serializer.is_valid())
    #     response = serializer.validated_data

        # Verify the response as needed.

    def test_invalid_login_serializer(self):
        data = {
            "phone": "1234567890",  # Correct phone number
            "password": "invalid_password",  # Invalid password
            "user_type": "1",  # User type ID
            "station": "456",  # Incorrect station code
        }

        serializer = UserLoginSerializer(data=data, context={'request': None})
        self.assertFalse(serializer.is_valid())

        # Ensure that user is not authenticated.

# Add more test cases as needed.
