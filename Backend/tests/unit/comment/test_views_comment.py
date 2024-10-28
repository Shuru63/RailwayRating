from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from comment.models import Comment
from comment.views import CommentAPI
from tests.setup import TestObjectFactory


class CommentAPITestCase(TestCase):
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
        task_shift_occur_id = factory.create_task_shift_occurrence(self.task, self.shift)
        Comment.objects.create(text="Abcd", task_shift_occur_id=task_shift_occur_id, date='2023-11-22', user=self.user)

        access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.user2)
        self.client = APIClient()
        self.client2 = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')


    def test_comment_create_comment(self):
        url = reverse(
            'add_comment', 
            kwargs={
                'date': '2023-11-22', 
                'task_id': 1, 
                'shift_id': 1, 
                'occurrence_id': 1}
                )
        post_data = {
            'text': 'Abcd', 
        }

        response = self.client.post(url, post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Comment is added')


    # Cannot create a comment without providing text
    def test_comment_create_comment_missing_text(self):
        post_data = {

        }

        response = self.client.post(reverse(
            'add_comment', 
            kwargs={
                'date': '2023-11-22', 
                'task_id': 1, 
                'shift_id': 1, 
                'occurrence_id': 1}
                ), post_data)
    

        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Please enter something')


    # Cannot create a comment with an invalid date format
    def test_comment_create_comment_invalid_date(self):
        post_data = {
            'text': 'Abcd', 
        }

        response = self.client.post(reverse(
            'add_comment', 
            kwargs={
                'date': '2023-22-11',   # Invalid date format
                'task_id': 1, 
                'shift_id': 1, 
                'occurrence_id': 1}
                ), post_data)


        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_comment_create_comment_unauthorized_role(self):
        post_data = {
            'text': 'Abcd', 
            'date': '2023-11-22',
        }

        response = self.client2.post(reverse(
            'add_comment', 
            kwargs={
                'date': post_data['date'], 
                'task_id': 1, 
                'shift_id': 1, 
                'occurrence_id': 1}
                ), post_data)
        

        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['message'], 'Permission Denied')


    def test_comment_get_comments(self):
        response = self.client.get(reverse(
            'get_comment', 
            kwargs={
                'date': '2023-11-22', 
                'task_id': 1, 
                'shift_id': 1, 
                'occurrence_id': 1}
                ))
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_comment_get_comments_not_found(self):
        response = self.client.get(reverse(
            'get_comment', 
            kwargs={
                'date': '2023-11-22', 
                'task_id': 2, 
                'shift_id': 1, 
                'occurrence_id': 3}
                ))
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_comment_update_comment(self):
        post_data = {
            'text': 'Abcde', 
        }

        response = self.client.put(reverse(
            'update_comment', 
            kwargs={
                'comment_id': 1
                }
                ), post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_comment_update_comment_unauthorized_role(self):
        post_data = {
            'text': 'Abcde', 
        }

        response = self.client2.put(reverse(
            'update_comment', 
            kwargs={
                'comment_id': 1
                }
                ), post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_comment_update_comment_not_found(self):
        post_data = {
            'text': 'Abcde', 
        }

        response = self.client.put(reverse(
            'update_comment', 
            kwargs={
                'comment_id': 2
                }
                ), post_data)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_comment_delete_comment(self):
        response = self.client.delete(reverse(
            'delete_comment', 
            kwargs={
                'comment_id': 1
                }
                ))
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_comment_delete_comment_unauthorized_role(self):
        response = self.client2.delete(reverse(
            'delete_comment', 
            kwargs={
                'comment_id': 1
                }
                ))
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_comment_delete_comment_not_found(self):
        response = self.client.delete(reverse(
            'delete_comment', 
            kwargs={
                'comment_id': 2
                }
                ))
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_comment_unauthenticated_user(self):
        self.client.logout()
        post_data = {
            'text': 'Abcd', 
        }

        response = self.client.post(reverse(
            'add_comment', 
            kwargs={
                'date': '2023-11-22',
                'task_id': 1, 
                'shift_id': 1, 
                'occurrence_id': 1}
                ), post_data)
        
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
