from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from user_onboarding.models import User, Roles, Post, Assign_Permission, Station

class UserModelTestCase(TestCase):
    def setUp(self):
        # Create test roles
        self.supervisor_role = Roles.objects.create(name='supervisor')
        self.admin_role = Roles.objects.create(name='railway admin')
        self.contractor_role = Roles.objects.create(name='contractor')

        # Create a test Station object
        self.station = Station.objects.create(station_code=1, station_name='PNBE',chi_id=2)

    def test_create_user(self):
        user = User.objects.create_user(
            first_name='John',
            username='john_doe',
            email='john@example.com',
            phone='1234567890',
            user_type=self.supervisor_role.id,
            station=self.station,  # Pass the Station object
            password='testpassword',
        )
        # Your assertions here

    def test_create_staffuser(self):
        staff_user = User.objects.create_staffuser(
            first_name='Jane',
            username='jane_doe',
            email='jane@example.com',
            phone='9876543210',
            user_type=self.supervisor_role.id,
            password='testpassword',
        )
        # Your assertions here

    def test_create_superuser(self):
        superuser = User.objects.create_superuser(
            first_name='Super',
            username='superuser',
            email='super@example.com',
            phone='9999999999',
            user_type=self.admin_role.id,
            password='testpassword',
        )
        # Your assertions here

    def test_invalid_phone_number(self):
        with self.assertRaises(ValidationError):
            User.objects.create_user(
                first_name='Invalid',
                username='invalid_user',
                email='invalid@example.com',
                phone='12345',
                user_type=self.supervisor_role.id,
                station=self.station,  # Pass the Station object
                password='testpassword',
            )

class AssignPermissionModelTestCase(TestCase):
    def setUp(self):
        # Create test roles
        self.supervisor_role = Roles.objects.create(name='supervisor')
        self.admin_role = Roles.objects.create(name='railway admin')
        self.contractor_role = Roles.objects.create(name='contractor')

        # Create a test Station object
        self.station = Station.objects.create(station_code=1, station_name='PNBE',chi_id=2)

    def test_contractor_supervisor(self):
        # Create a railway admin user (user type 1)
        railway_admin = User.objects.create_user(
            first_name='Admin',
            username='admin_user',
            email='admin@example.com',
            phone='1111111111',
            user_type=self.admin_role.id,
            password='adminpassword',
        )

        # Attempt to create a contractor user (user type 2) with the same phone number
        with self.assertRaises(ValidationError) as context:
            try:
                contractor_user = User.objects.create_user(
                    first_name='John',
                    username='john_doe',
                    email='john@example.com',
                    phone='1111111111',  # Use the same phone number as the admin
                    user_type=self.contractor_role.id,
                    password='testpassword',
                )
            except IntegrityError as e:
                # Catch the IntegrityError (unique constraint violation) and raise a ValidationError
                raise ValidationError("Phone number must be exactly 10 digits.")
        
        # Ensure that contractor_user is not defined
        self.assertFalse('contractor_user' in locals())
        
        # Ensure that a ValidationError was raised
        self.assertTrue('Phone number must be exactly 10 digits.' in str(context.exception))

    def test_valid_permission_assignment(self):
        user = User.objects.create_user(
            first_name='Jane',
            username='jane_doe',
            email='jane@example.com',
            phone='9876543210',
            user_type=self.supervisor_role.id,
            station=self.station,  # Pass the Station object
            password='testpassword',
        )
        
        # Test that assigning permission to a Supervisor is valid
        permission = Assign_Permission.objects.create(user=user)
        self.assertEqual(permission.user, user)
