from django.test import TestCase
from notified_users.models import notified_users, Post
from notified_task.models import notified_task
from station.models import Station

class NotifiedUsersModelTestCase(TestCase):
    def setUp(self):
        # Create a sample Post
        self.post = Post.objects.create(content="Sample Content")

        # Create a sample notified_task
        self.task = notified_task.objects.create(task_description="Sample Task")

        # Create a sample Station
        self.station = Station.objects.create(
            station_code=1,
            station_name="Sample Station",
            chi_id=1
        )

        # Create a sample notified_users instance
        self.user = notified_users.objects.create(
            username="sample_user",
            whatsapp_number="1234567890",
            mobile_number="9876543210",
            email="user@example.com"
        )
        self.user.posts.add(self.post)
        self.user.assigned_tasks.add(self.task)
        self.user.assigned_station.add(self.station)

    def test_notified_users_model(self):
        # Retrieve the notified_users instance from the database
        user_from_db = notified_users.objects.get(username="sample_user")

        # Test that the retrieved user matches the initial data
        self.assertEqual(user_from_db.username, "sample_user")
        self.assertEqual(user_from_db.whatsapp_number, "1234567890")
        self.assertEqual(user_from_db.mobile_number, "9876543210")
        self.assertEqual(user_from_db.email, "user@example.com")

        # Test the many-to-many relationship with Post
        self.assertEqual(user_from_db.posts.count(), 1)
        self.assertEqual(user_from_db.posts.first(), self.post)

        # Test the many-to-many relationship with notified_task
        self.assertEqual(user_from_db.assigned_tasks.count(), 1)
        self.assertEqual(user_from_db.assigned_tasks.first(), self.task)

        # Test the many-to-many relationship with Station
        self.assertEqual(user_from_db.assigned_station.count(), 1)
        self.assertEqual(user_from_db.assigned_station.first(), self.station)

    def tearDown(self):
        # Clean up objects created during testing
        self.post.delete()
        self.task.delete()
        self.station.delete()
        self.user.delete()
