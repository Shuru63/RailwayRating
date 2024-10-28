from django.test import TestCase
from station.models import Station
from user_onboarding.models import Roles, User
from shift.models import Shift, Verified_shift

class ShiftModelTestCase(TestCase):
    def setUp(self):
        self.station = Station.objects.create(
            station_code="1",
            station_name="Test Station",
            chi_id=2
        )

    def test_create_shift(self):
        shift = Shift.objects.create(
            shift_id=1,
            start_time='08:00:00',
            end_time='16:00:00',
            station=self.station,
            created_by='Test User'
        )
        self.assertIsInstance(shift, Shift)
        self.assertEqual(shift.shift_id, 1)
        # Add more assertions for other fields

    def test_create_verified_shift(self):
        user_type = Roles.objects.create(name="supervisor")
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword',
            email='test@example.com',
            first_name='Test',
            phone='1234567891',
            user_type=user_type.id
        )
        verified_shift = Verified_shift.objects.create(
            shift=Shift.objects.create(
                shift_id=2,
                start_time='09:00:00',
                end_time='17:00:00',
                station=self.station,
                created_by=self.user.username
            ),
            verified_shift_date='2023-09-28',
            verified_by=self.user,
            verified_email='test@example.com',
            verification_status=True
        )
        self.assertIsInstance(verified_shift, Verified_shift)
        self.assertEqual(verified_shift.verified_shift_date, '2023-09-28')
        # Add more assertions for other fields

    def tearDown(self):
        Station.objects.all().delete()
        Shift.objects.all().delete()
        Verified_shift.objects.all().delete()
        User.objects.all().delete()
