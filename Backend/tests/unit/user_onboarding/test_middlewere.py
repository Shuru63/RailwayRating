from django.test import RequestFactory, TestCase
from django.http import JsonResponse
from user_onboarding.models import User,Roles
from django.urls import reverse
from user_onboarding.middleware import AdminSuperuserMiddleware
class TestAdminSuperuserMiddleware(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = AdminSuperuserMiddleware(get_response=None)

        # Create a Roles instance first
        role = Roles.objects.create(name=1)  # Create a role with an appropriate name

        # Create users with the appropriate user_type
        self.admin = User.objects.create_user(
            username='admin',
            password='admin_pass',
            first_name='Admin',
            email='admin@example.com',
            phone='1234567890',
            user_type=role  # Provide the Roles instance here
        )

        self.user = User.objects.create_user(
            username='user',
            password='user_pass',
            first_name='User',
            email='user@example.com',
            phone='9876543210',
            user_type=role  # Provide the Roles instance here
        )
    def test_middleware_allowed_for_superuser(self):
        request = self.factory.get(reverse('admin:index'))
        request.user = self.admin

        response = self.middleware(request)
        self.assertIsNone(response)

    def test_middleware_restricted_for_non_superuser(self):
        request = self.factory.get(reverse('admin:index'))
        request.user = self.user

        response = self.middleware(request)
        self.assertIsInstance(response, JsonResponse)
        self.assertEqual(response.status_code, 403)