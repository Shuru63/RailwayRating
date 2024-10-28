import os
import tempfile
from unittest import TestCase
from unittest.mock import patch, MagicMock

from pdf.utils import compress_pdf, upload_file_to_drive, send_pdf

class UtilsTestCase(TestCase):

    # @patch('pdf.utils.PDFNet')
    # def test_compress_pdf(self, mock_pdfnet):
    #     with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_input, tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_output:
    #         temp_input.write(b'Test PDF content')  # Replace with the actual content of your PDF
    #         temp_input_path = temp_input.name
    #         temp_output_path = temp_output.name
    #         temp_input.close()
    #         temp_output.close()
    #         input_size, output_size = compress_pdf(temp_input_path, temp_output_path)

    #     # Assert that the output file size is less than the input file size
    #     self.assertTrue(output_size < input_size)

    #     # Clean up the created file
    #     os.remove(temp_output_path)

    @patch('pdf.utils.service_account.Credentials.from_service_account_file')
    @patch('pdf.utils.build')
    def test_upload_file_to_drive(self, mock_build, mock_credentials):
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(b'Test PDF content')  # Replace with the actual content of your PDF
            temp_file_path = temp_file.name
            temp_file.close()

        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp_key:
            temp_key.write(b'Test service account key content')  # Replace with the actual content of your service account key
            temp_key_path = temp_key.name
            temp_key.close()

        file_name = "example_file.pdf"  # Provide the desired file name
        FOLDER_ID = "your_folder_id"  # Provide the desired folder ID
        public_url = upload_file_to_drive(file_name, temp_file_path, temp_key_path, FOLDER_ID)

        # Assert that the public URL is not empty
        self.assertNotEqual(public_url, "")

    @patch('pdf.utils.EmailMessage')
    def test_send_pdf(self, mock_email_message):
        subject = 'Test Subject'
        message = 'Test Message'
        from_ = 'from@example.com'
        to = ['to@example.com']

        send_pdf(subject, message, from_, to)

        # Assert that the email message was sent
        mock_email_message.return_value.send.assert_called_once()
