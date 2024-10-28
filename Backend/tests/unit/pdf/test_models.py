from django.test import TestCase
from station.models import Station
from user_onboarding.models import User, Roles
from pdf.models import DailyEvaluationVerification

class DailyEvaluationVerificationTestCase(TestCase):
    def setUp(self):
        # Create a Roles instance (if it doesn't already exist)
        user_type, created = Roles.objects.get_or_create(name="Some Role")

        # Create a Station instance
        self.station = Station.objects.create(
            station_name="Test Station",
            station_code=123,
            station_zone="Test Zone",
            chi_id=1,
        )

        # Create a User instance
        self.user = User.objects.create(
            first_name="John",
            last_name="Doe",
            username="johndoe",
            email="johndoe@example.com",
            phone="1234567890",
            user_type=user_type,  # Assign the user_type here
            # Add other necessary fields here
        )

        # Create a DailyEvaluationVerification instance for testing
        self.verification = DailyEvaluationVerification.objects.create(
            verified_eval_date="2023-10-10",
            verified_by=self.user,
            station=self.station,
            email="test@example.com",
            verification_status=True,
        )

    def test_daily_evaluation_verification_creation(self):
        # Test the creation of the DailyEvaluationVerification model instance
        self.assertEqual(str(self.verification.verified_eval_date), "2023-10-10")
        self.assertEqual(self.verification.verified_by, self.user)
        self.assertEqual(self.verification.station, self.station)
        self.assertEqual(self.verification.email, "test@example.com")
        self.assertTrue(self.verification.verification_status)
