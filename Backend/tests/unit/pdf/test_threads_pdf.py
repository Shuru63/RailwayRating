from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.http import HttpRequest
from queue import Queue
from unittest.mock import patch

from tests.setup import TestObjectFactory
from pdf.threads import DailyDataImages, MonthlyData, GetPdf


class TestThreads(TestCase):
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
        self.shift1 = factory.create_shift(1, self.station, "06:00:00", "14:00:00")
        self.shift2 = factory.create_shift(2, self.station, "14:00:00", "22:00:00")
        self.shift3 = factory.create_shift(3, self.station, "22:00:00", "06:00:00")
        self.task_shift_occur_id = factory.create_task_shift_occurrence(self.task, self.shift1)

        self.access_token = factory.generate_token(self.user)
        access_token2 = factory.generate_token(self.user2)
        self.client = APIClient()
        self.client2 = APIClient()
        mobile_user_agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
        self.client.credentials(HTTP_USER_AGENT=mobile_user_agent, HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        self.client2.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token2}')


    # @patch()
    # @patch('pdf.threads.upload_file_to_drive', return_value=)
    # def test_daily_data_images_run(self):
    #     request = HttpRequest()
    #     request.method = 'GET'
    #     request.user = self.user
    #     method = 'GET'
    #     date = '2023-11-28'
    #     queue = Queue()

    #     daily_data_images = DailyDataImages(method, date, queue, request)

    #     daily_data_images.start()

    #     with patch('pdf.threads.upload_file_to_drive') as mocked_upload_file_to_drive:
    #         mocked_upload_file_to_drive.return_value = 'http://dummyurl.com'
    #         mocked_upload_file_to_drive.assert_called_once()
        # with patch('pdf.threads.send_pdf') as mocked_send_pdf:
        #     # daily_data_images.join(timeout=1)
        #     mocked_send_pdf.assert_called_once()

        # daily_data_images.join(timeout=1)



