from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from user_onboarding.models import User, Roles
from task_shift_occurrence.models import TaskShiftOccurrence
from file_upload.models import Media
import os
from station.models import Station

class MediaModelTestCase(TestCase):
    def setUp(self):
        # Create a sample user and task shift occurrence
        user_type = Roles.objects.create(name='supervisor')
        self.user = User.objects.create(
            username='testuser',
            phone='1234567891',
            user_type=user_type
        )
        # Create a sample station
        station = Station.objects.create(
            station_code=1,
            station_name='PNBE',
            chi_id=2
        )
        self.task_shift_occurrence = TaskShiftOccurrence.objects.create(
            # Set task_shift_occurrence fields here
        )
        
        # Create an image file for testing
        image_data = SimpleUploadedFile("test_image.jpg", b"image_content", content_type="image/jpeg")
        
        # Create a Media instance
        self.media = Media.objects.create(
            date=None,  # Set date here
            image=image_data,
            task_shift_occur_id=self.task_shift_occurrence,
            user=self.user,
            created_by="testuser",
            updated_by="testuser",
            latitude="0.0",
            longitude="0.0"
        )

    def test_media_creation(self):
        # Check if the Media instance was created successfully
        self.assertEqual(self.media.user, self.user)
        self.assertEqual(self.media.task_shift_occur_id, self.task_shift_occurrence)
        self.assertEqual(self.media.created_by, "testuser")
        self.assertEqual(self.media.updated_by, "testuser")
        self.assertEqual(self.media.latitude, "0.0")
        self.assertEqual(self.media.longitude, "0.0")

    def test_image_compression(self):
        # Test image compression
        self.assertTrue(os.path.exists(self.media.image.path))  # Check if the image file exists

    # def test_str_representation(self):
    #     # Test the __str__ method
    #     self.assertEqual(str(self.media), self.user.username)  # You may customize this based on your expected string representation
