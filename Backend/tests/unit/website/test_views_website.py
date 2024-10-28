from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from user_onboarding.models import User, Roles
from station.models import Station

class WebsiteViewsTestCase(APITestCase):
    def setUp(self):
        # Create a test user and assign a role
        user_type = Roles.objects.create(name="supervisor")
        station = Station.objects.create(station_code='2', station_name='PNBE', chi_id=1)
        self.user = User.objects.create(
            username='testuser',
            password='testpassword',
            email='test@example.com',
            first_name='Test',
            phone='1234567891',
            user_type=user_type
        )
        self.role = Roles.objects.create(name="supervisor")
        self.user.user_type = self.role
        self.user.save()

    def test_home_view_supervisor(self):
        # Log in as the test user
        self.client.force_authenticate(user=self.user)

        # Make a GET request to the Home view
        url = reverse('Home')
        response = self.client.get(url)

        # Check that the response has a 200 OK status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the response data for a message
        self.assertIn("You can read and write ratings", response.data["messages"])

    def test_home_view_contractor(self):
        # Create a test user with a different role (contractor)
        contractor_role = Roles.objects.create(name="contractor")
        contractor = User.objects.create(username="contractor", password="testpassword",phone='1234565891',user_type=contractor_role)
        contractor.user_type = contractor_role
        contractor.save()

        # Log in as the contractor user
        self.client.force_authenticate(user=contractor)

        # Make a GET request to the Home view
        url = reverse('Home')
        response = self.client.get(url)

        # Check that the response has a 200 OK status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the response data for a message
        self.assertIn("You can read ratings and upload Images", response.data["messages"])

    def test_home_view_officer(self):
        # Create a test user with a different role (officer)
        officer_role = Roles.objects.create(name="officer")
        officer = User.objects.create(username="officer", password="testpassword", phone='1234565291', user_type=officer_role)
        officer.user_type = officer_role
        officer.save()

        # Log in as the officer user
        self.client.force_authenticate(user=officer)

        # Make a GET request to the Home view
        url = reverse('Home')
        response = self.client.get(url)

        # Check that the response has a 200 OK status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the response data for the actual message returned
        self.assertIn("current station is PNBE", response.data["messages"])

        # Check the value of "mobile_device" (if needed)
        self.assertEqual(response.data["mobile_device"], 1)

    def test_speed_test_view(self):
        # Log in as the test user
        self.client.force_authenticate(user=self.user)

        # Make a GET request to the speed_test view
        url = reverse('Home')  # Use the correct view name
        response = self.client.get(url)

        # Check that the response has a 200 OK status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the response data for the expected keys
        self.assertIn("messages", response.data)
        self.assertIn("mobile_device", response.data)
        self.assertIn("sup", response.data)

        # Optionally, you can check the values of these keys
        self.assertEqual(response.data["messages"], ['You can read and write ratings'])
        self.assertEqual(response.data["mobile_device"], 1)
        self.assertEqual(response.data["sup"], 'supervisor')


    def test_health_check_view(self):
        # Log in as the test user
        self.client.force_authenticate(user=self.user)

        # Make a GET request to the health_check view
        url = reverse('Home')  # Use the correct view name
        response = self.client.get(url)

        # Check that the response has a 200 OK status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the response data for the expected keys
        self.assertIn("messages", response.data)
        self.assertIn("mobile_device", response.data)
        self.assertIn("sup", response.data)
        
        # Optionally, you can check the values of these keys
        self.assertEqual(response.data["messages"], ['You can read and write ratings'])
        self.assertEqual(response.data["mobile_device"], 1)
        self.assertEqual(response.data["sup"], 'supervisor')
