# from django.test import TestCase
# from user_onboarding.models import User
# from station.models import Station
# from inspection_feedback.models import Inspection_feedback
# from user_onboarding.models import Roles

# class InspectionFeedbackTestCase(TestCase):
#     def test_inspection_feedback_creation(self):
#         # Create a dummy role for testing
#         dummy_role = Roles.objects.create(name="Test Role")

#         station = Station.objects.create(station_name="Test Station", station_code=123,chi_id=1)
#         user = User.objects.create(
#             first_name="John",
#             last_name="Doe",
#             username="johndoe",
#             email="johndoe@example.com",
#             phone="1234567890",  # Provide any value for the phone
#             user_type=dummy_role,  # Specify the dummy role
#         )

#         feedback = Inspection_feedback.objects.create(
#             rating="Excellent",
#             remarks="Test remarks",
#             user=user,
#             station=station,
#             created_by="Test User",
#             updated_by="Test User",
#         )

#         self.assertEqual(feedback.rating, "Excellent")
#         self.assertEqual(feedback.remarks, "Test remarks")
#         self.assertEqual(feedback.user, user)
#         self.assertEqual(feedback.station, station)
#         self.assertEqual(feedback.created_by, "Test User")
#         self.assertEqual(feedback.updated_by, "Test User")

from django.test import TestCase
from user_onboarding.models import User,Roles
from station.models import Station
from inspection_feedback.models import Inspection_feedback


class InspectionFeedbackTest(TestCase):
    def setUp(self):
        # Create a role
        role = Roles.objects.create(name='some_type')  # Adjust this based on your Roles model

        # Create a user with the appropriate role
        self.user = User.objects.create(
            username='testuser',
            password='testpassword',
            email='test@example.com',
            phone='1234567890',
            user_type=role  # Set the user_type to the role you created
        )
        self.station = Station.objects.create(station_name='Test Station', station_id=1, station_code=1234,
                                              chi_id=5678, station_zone='Test Zone', station_penalty=0.0,
                                              name_of_work='Test Work', contract_by='Test Company', contract_no='123ABC')

    def test_inspection_feedback_creation(self):
        feedback = Inspection_feedback.objects.create(
            rating='Excellent',
            remarks='Test remarks',
            user=self.user,
            station=self.station,
            created_by='Test User',
            updated_by='Test User'
        )

        self.assertEqual(feedback.rating, 'Excellent')
        self.assertEqual(feedback.remarks, 'Test remarks')
        self.assertEqual(feedback.user, self.user)
        self.assertEqual(feedback.station, self.station)
        self.assertEqual(feedback.created_by, 'Test User')
        self.assertEqual(feedback.updated_by, 'Test User')