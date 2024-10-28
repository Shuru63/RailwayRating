import os
from django.http import HttpResponse
from django.test import TestCase, RequestFactory
from file_upload.serve_media_files import serve_file


class ServeFileTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.test_file_path = "test_file.txt"
        self.media_directory = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media")
        self.full_test_file_path = os.path.join(self.media_directory, self.test_file_path)

        with open(self.full_test_file_path, "w") as f:
            f.write("Test file content")

    def tearDown(self):
        os.remove(self.full_test_file_path)

    # def test_serve_file_existing(self):
    #     request = self.factory.get(f"/serve/{self.test_file_path}")
    #     response = serve_file(request, self.test_file_path)
    #     self.assertEqual(response.status_code, 200)
    #     self.assertEqual(response.content, b"Test file content")

    def test_serve_file_non_existing(self):
        non_existing_file_path = "non_existing_file.txt"
        request = self.factory.get(f"/serve/{non_existing_file_path}")
        response = serve_file(request, non_existing_file_path)
        self.assertEqual(response.status_code, 404)


if __name__ == '__main__':
    TestCase.main()
