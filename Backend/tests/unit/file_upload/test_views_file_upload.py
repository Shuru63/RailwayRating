from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from django.core.files.uploadedfile import SimpleUploadedFile

from tests.setup import TestObjectFactory
from file_upload.models import Media


class MediaAPITestCase(TestCase):
    def setUp(self):
        factory = TestObjectFactory()

        self.user_type = factory.create_role("supervisor")
        self.unauthorized_role = factory.create_role("unauthorized")
        self.station = factory.create_station('Test Station', 1, 2)
        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        self.user2 = factory.create_user("testuser2", 'test2@email.com', self.unauthorized_role, self.station, '1234567890')
        factory.create_assign_permission(self.user)
        factory.create_assign_permission(self.user2)
        self.task = factory.create_task(1, 'test desc', self.station, 730, 1)
        self.shift = factory.create_shift(1, self.station, "22:00:00", "06:00:00")
        self.task_shift_occur_id = factory.create_task_shift_occurrence(self.task, self.shift)

        self.station2 = factory.create_station('Test Station 2', 2, 3)
        self.contractor_role = factory.create_role("contractor")
        self.contractor = factory.create_user("contractor", 'contractor@email.com', self.contractor_role, self.station2, '1234567894')
        

        self.image_path = 'tests/unit/file_upload/test_image.jpg'
        with open(self.image_path, 'rb') as img:
            self.image = SimpleUploadedFile(
                name='test_image.jpg', 
                content=img.read(), 
                content_type='image/jpeg'
                )

        self.media = Media.objects.create(
            image=self.image, 
            task_shift_occur_id=self.task_shift_occur_id, 
            date='2023-11-24', 
            user=self.user
            )
        
        self.media2 = Media.objects.create(
            image=self.image, 
            task_shift_occur_id=self.task_shift_occur_id, 
            date='2023-11-22', 
            user=self.contractor
            )

        access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.user2)
        self.client = APIClient()
        self.client2 = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')


    def test_get_media(self):
        url = reverse('get_media', args=[self.task.task_id, self.shift.shift_id, self.task_shift_occur_id.occurrence_id])

        response = self.client.get(url, {'date': '2023-11-24'})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_get_media_not_found(self):
        url = reverse('get_media', args=[999, 999, 999])  # Non-existent IDs
        
        response = self.client.get(url, {'date': '2023-11-24'})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_get_media_no_media_on_date(self):
        url = reverse('get_media', args=[self.task.task_id, self.shift.shift_id, self.task_shift_occur_id.occurrence_id])

        response = self.client.get(url, {'date': '2023-11-23'})  # A date with no media
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


    def test_post_media(self):
        url = reverse('add_media', args=[self.task.task_id, self.shift.shift_id, self.task_shift_occur_id.occurrence_id])
        with open(self.image_path, 'rb') as img:
            post_data = {
                'image': img,
                'date': '2023-11-22',
                'latitude': '10.0000',
                'longitude': '20.0000',
            }
            response = self.client.post(url, post_data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)


    def test_post_media_missing_data(self):
        url = reverse('add_media', args=[self.task.id, self.shift.id, self.task_shift_occur_id.occurrence_id])
        with open(self.image_path, 'rb') as img:
            post_data = {
                'image': img,
                'date': '2023-11-22',
                # 'latitude': '10.0000',  # Missing latitude
                'longitude': '20.0000',
            }
            response = self.client.post(url, post_data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(response.data['message'], 'Data missing: latitude')


    def test_post_media_not_found(self):
        url = reverse('add_media', args=[999, 999, 999])  # Non-existent IDs
        with open(self.image_path, 'rb') as img:
            post_data = {
                'image': img,
                'date': '2023-11-22',
                'latitude': '10.0000',
                'longitude': '20.0000',
            }
            response = self.client.post(url, post_data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_post_media_unauthorized(self):
        url = reverse('add_media', args=[self.task.task_id, self.shift.shift_id, self.task_shift_occur_id.occurrence_id])
        with open(self.image_path, 'rb') as img:
            post_data = {
                'image': img,
                'date': '2023-11-22',
                'latitude': '10.0000',
                'longitude': '20.0000',
            }
            response = self.client2.post(url, post_data)  # Using the unauthorized client
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_put_media(self):
        url = reverse('update_media', args=[self.media.id])
        # with open('path_to_your_test_image.jpg', 'rb') as img:
        put_data = {
            # 'image': img,
            'date': '2023-11-25',  # Updated date
            'latitude': '10.0000',
            'longitude': '20.0000',
        }
        response = self.client.put(url, put_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Image updated')


    def test_put_media_unauthorized(self):
        url = reverse('update_media', args=[self.media.id])
        put_data = {
            'date': '2023-11-25',  # Updated date
            'latitude': '10.0000',
            'longitude': '20.0000',
        }
        response = self.client2.put(url, put_data)  # Using the unauthorized client
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_put_media_not_found(self):
        url = reverse('update_media', args=[999])   # Non-existent ID
        put_data = {
            'date': '2023-11-25',
            'latitude': '10.0000',
            'longitude': '20.0000',
        }
        response = self.client.put(url, put_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['message'], 'Media not found')


    def test_delete_media(self):
        url = reverse('delete_media', args=[self.media.id])

        response = self.client.delete(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that the media was actually deleted
        with self.assertRaises(Media.DoesNotExist):
            Media.objects.get(id=self.media.id)


    def test_delete_media_not_found(self):
        url = reverse('delete_media', args=[999])  # Non-existent ID

        response = self.client.delete(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_delete_media_unauthorized(self):
        url = reverse('delete_media', args=[self.media.id])

        response = self.client2.delete(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_delete_media_different_station_supervisor(self):
        url = reverse('delete_media', args=[self.media2.id])

        response = self.client.delete(url)  # Using the client of the supervisor from a different station
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        expected_message = 'You can only delete media of Test Station.'
        self.assertEqual(response.data['message'], expected_message)


    def test_post_check_image_exists(self):
        url = reverse('check_image_exists')
        with open(self.image_path, 'rb') as img:
            post_data = {
                'myfile': img,
            }

            response = self.client.post(url, post_data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['exists'])


    def test_post_check_image_not_exists(self):
        url = reverse('check_image_exists')
        with open('tests/unit/file_upload/non_existing_img.jpg', 'rb') as img:
            post_data = {
                'myfile': img,
            }

            response = self.client.post(url, post_data)
            # print(response.data)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
            self.assertFalse(response.data['exists'])


    def test_post_check_image_no_file(self):
        url = reverse('check_image_exists')
        post_data = {}

        response = self.client.post(url, post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_view_media(self):
        url = reverse('view_media', args=[
            self.media.id, self.task.id, self.shift.id, self.task_shift_occur_id.occurrence_id, 'prev_page'])

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_view_media_not_found(self):
        url = reverse('view_media', args=[
            999, self.task.id, self.shift.id, self.task_shift_occur_id.occurrence_id, 'prev_page'])  # Non-existent ID

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_view_media_unauthorized(self):
        url = reverse('view_media', args=[
            self.media.id, self.task.id, self.shift.id, self.task_shift_occur_id.occurrence_id, 'prev_page'])

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
