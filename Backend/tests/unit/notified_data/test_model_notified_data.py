from django.test import TestCase
from notified_task.models import notified_task
from user_onboarding.models import User,Roles
from notified_data.models import notified_data
from station.models import Station

class NotifiedDataModelTestCase(TestCase):
    def setUp(self):
        user_type = Roles.objects.create(name="supervisor")

        # Create a sample station
        station = Station.objects.create(
            station_code=1,
            station_name='PNBE',
            chi_id=2
        )

        # Create a sample notified_task
        self.notified_task = notified_task.objects.create(
            # Set notified_task fields here
        )

        # Create a sample user and associate it with the station
        self.user = User.objects.create(
            username='testuser',
            phone='1234567891',
            user_type=user_type,
            station=station  # Associate the user with the station
            # Set other user fields here
        )

    def test_notified_data_creation(self):
        # Create a notified_data instance
        notified_data_instance = notified_data.objects.create(
            task=self.notified_task,
            feedback='Sample feedback',
            user=self.user,
        )

        # Check if the notified_data instance was created successfully
        self.assertEqual(notified_data_instance.task, self.notified_task)
        self.assertEqual(notified_data_instance.feedback, 'Sample feedback')
        self.assertEqual(notified_data_instance.user, self.user)

    def test_user_name_auto_generation(self):
        # Create a notified_data instance with a user
        notified_data_instance = notified_data.objects.create(
            task=self.notified_task,
            feedback='Sample feedback',
            user=self.user,
        )

        # Check if the user_name field was automatically generated
        self.assertEqual(notified_data_instance.user_name, 'testuser')

    def test_user_name_default_value(self):
        # Create a notified_data instance without a user
        notified_data_instance = notified_data.objects.create(
            task=self.notified_task,
            feedback='Sample feedback',
            user=None,
        )

        # Check if the user_name field has the default value
        self.assertEqual(notified_data_instance.user_name, '')
