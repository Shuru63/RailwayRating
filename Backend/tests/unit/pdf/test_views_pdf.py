from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from tests.setup import TestObjectFactory


class PDFTestCase(TestCase):
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


    def test_getpdf_sum_daily_report_get(self):
        url = reverse('getpdf_sum_daily_report')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_daily_report_post(self):
        url = reverse('getpdf_sum_daily_report')

        response = self.client.post(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_daily_report_post_missing_date(self):
        url = reverse('getpdf_sum_daily_report')

        response = self.client.post(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_getpdf_sum_daily_get(self):
        url = reverse('getpdf_sum_daily')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_daily_post(self):
        url = reverse('getpdf_sum_daily')

        response = self.client.post(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_daily_post_missing_date(self):
        url = reverse('getpdf_sum_daily')

        response = self.client.post(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_getpdf_sum_daily_images_get(self):
        url = reverse('getpdf_sum_daily_images')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_daily_images_post(self):
        url = reverse('getpdf_sum_daily_images')

        response = self.client.post(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_daily_images_post_missing_date(self):
        url = reverse('getpdf_sum_daily_images')

        response = self.client.post(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_getpdf_sum_monthly_get(self):
        url = reverse('getpdf_sum_monthly')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_monthly_post(self):
        url = reverse('getpdf_sum_monthly')

        response = self.client.post(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_monthly_post_mmissing_date(self):
        url = reverse('getpdf_sum_monthly')

        response = self.client.post(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_getpdf_sum_monthly_download_get(self):
        url = reverse('getpdf_sum_monthly_download')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_monthly_download_post(self):
        url = reverse('getpdf_sum_monthly_download')

        response = self.client.post(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_getpdf_sum_monthly_download_post_missing_date(self):
        url = reverse('getpdf_sum_monthly_download')

        response = self.client.post(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_get_pdf_sp_get(self):
        url = reverse('getpdf_sp')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_get_pdf_sp_post(self):
        url = reverse('getpdf_sp')

        response = self.client.post(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_get_pdf_sp_post_missing_date(self):
        url = reverse('getpdf_sp')

        response = self.client.post(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_get_pdf_get(self):
        url = reverse('getpdf')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_get_pdf_post(self):
        url = reverse('getpdf')

        response = self.client.post(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_get_pdf_post_missing_date(self):
        url = reverse('getpdf')

        response = self.client.post(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_get_pre_daily_feedback(self):
        url = reverse('get_pre_daily_feedback')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_signature_daily_evaluation(self):
        url = reverse('signature_daily_evaluation')

        response = self.client.get(url, {'date': '2023-11-28'})
        # print(response)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_signature_daily_evaluation_missing_date(self):
        url = reverse('signature_daily_evaluation')

        response = self.client.get(url, {})
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_which_pdf_mobile_user(self):
        url = reverse('whichpdf')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_which_pdf_pc_user(self):
        pc_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        self.client.credentials(HTTP_USER_AGENT=pc_user_agent, HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        url = reverse('whichpdf')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_which_pdf_tablet_user(self):
        tablet_user_agent = 'Mozilla/5.0 (Linux; U; Android 2.2; en-us; SCH-I800 Build/FROYO) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
        self.client.credentials(HTTP_USER_AGENT=tablet_user_agent, HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        url = reverse('whichpdf')

        response = self.client.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_which_pdf_unauthorized(self):
        url = reverse('whichpdf')

        response = self.client2.get(url)
        # print(response.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
