from django.test import TestCase
from pax_deployed.models import Pax
from user_onboarding.models import Roles, User
from shift.models import Shift
from datetime import date
from django.contrib.auth.models import User as AuthUser
from station.models import Station

class PaxModelTestCase(TestCase):
    def setUp(self):

        # Create a sample Station
        self.station = Station.objects.create(
            station_code=1,
            station_name="Sample Station",
            chi_id=1
        )
        
        # Create a sample Shift
        self.shift = Shift.objects.create(
            start_time='08:00:00',
            end_time='16:00:00',
            station=self.station
        )

        # Create a sample User
        user_type = Roles.objects.create(name="supervisor")
        self.user = User.objects.create(
            username='testuser',
            password='testpassword',
            email='test@example.com',
            first_name='Test',
            phone='1234567891',
            user_type=user_type
        )

        # Create a sample Pax instance
        self.pax = Pax.objects.create(
            count=10,
            date=date.today(),
            shift=self.shift,
            user=self.user,
            created_by='Test User',
            Pax_status='pending'
        )

    def test_pax_model(self):
        # Retrieve the Pax instance from the database
        pax_from_db = Pax.objects.get(count=10)  # Adjust this query based on your data

        # Test that the retrieved Pax matches the initial data
        self.assertEqual(pax_from_db.count, 10)
        self.assertEqual(pax_from_db.date, date.today())
        self.assertEqual(pax_from_db.shift, self.shift)
        self.assertEqual(pax_from_db.user, self.user)
        self.assertEqual(pax_from_db.user_name, self.user.username)
        self.assertEqual(pax_from_db.created_by, 'Test User')
        self.assertEqual(pax_from_db.Pax_status, 'pending')

    def tearDown(self):
        # Clean up objects created during testing
        self.shift.delete()
        self.user.delete()
        self.pax.delete()
