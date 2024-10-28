from django.test import TestCase
from user_onboarding.models import User, Roles
from station.models import Station
from feedback.models import Feedback
from datetime import date, time

class FeedbackModelTestCase(TestCase):
    def setUp(self):
        user_type = Roles.objects.create(name="supervisor")
        # Create a sample user and station for testing
        self.user = User.objects.create(username='testuser', phone='1234567891', user_type=user_type)
        self.station = Station.objects.create(station_code=2, station_name="PNBE", chi_id=3)

    def test_feedback_creation(self):
        # Create a Feedback instance
        feedback = Feedback(
            feedback_value_1='2',
            feedback_value_2='1',
            feedback_value_3='0',
            feedback_value_4='2',
            feedback_value_5='1',
            passenger_name='John Doe',
            mobile_no='1234567891',
            ticket_no='ABC123',
            email='test@example.com',
            verified=True,
            date=date(2023, 9, 28),
            time=time(12, 0),  # Provide a default time value
            user=self.user,
            created_by='Test User',
            station=self.station,
        )

        # Save the Feedback instance
        try:
            feedback.save()
        except Exception as e:
            print(f"Error saving feedback: {e}")

        # Retrieve the saved Feedback instance from the database
        saved_feedback = Feedback.objects.get(id=feedback.id)

        # Check if the fields match the expected values
        self.assertEqual(saved_feedback.feedback_value_1, '2')
        self.assertEqual(saved_feedback.feedback_value_2, '1')
        self.assertEqual(saved_feedback.feedback_value_3, '0')
        self.assertEqual(saved_feedback.feedback_value_4, '2')
        self.assertEqual(saved_feedback.feedback_value_5, '1')
        self.assertEqual(saved_feedback.passenger_name, 'John Doe')
        self.assertEqual(saved_feedback.mobile_no, '1234567891')
        self.assertEqual(saved_feedback.ticket_no, 'ABC123')
        self.assertEqual(saved_feedback.email, 'test@example.com')
        self.assertTrue(saved_feedback.verified)
        self.assertEqual(saved_feedback.date, date(2023, 9, 28))  # Compare to a date object
        self.assertEqual(saved_feedback.time.strftime('%H:%M:%S'), '12:00:00')
        self.assertEqual(saved_feedback.user, self.user)
        self.assertEqual(saved_feedback.user_name, 'testuser')
        self.assertEqual(saved_feedback.created_by, 'Test User')
        self.assertEqual(saved_feedback.station, self.station)

    def test_str_method(self):
        # Create a Feedback instance with a user and a valid date
        feedback_with_user = Feedback(
            user=self.user,
            created_by='Test User',
            date=date(2023, 9, 28),  # Provide a valid date
            time=time(12, 0),
        )
        feedback_with_user.save()

        # Check if the __str__ method returns the expected username
        self.assertEqual(str(feedback_with_user), 'testuser')

        # Create a Feedback instance without a user and set 'created_by' to 'Test User'
        feedback_without_user = Feedback(
            created_by='Test User',
            date=date(2023, 9, 28),
            time=time(12, 0),
        )
        feedback_without_user.save()

        # Check if the __str__ method returns the expected 'created_by' value
        self.assertEqual(str(feedback_without_user), '')
