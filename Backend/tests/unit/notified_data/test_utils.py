import unittest
from unittest.mock import patch, Mock
from notified_data.utils import send_email, send_sms_message_twilio


class TestUtils(unittest.TestCase):

    def test_send_email(self):
        with patch('smtplib.SMTP') as mock_smtp:
            send_email("Test Subject", "Test Body", "test@example.com")
            mock_smtp.assert_called_once()

    @patch('twilio.rest.Client')
    def test_send_sms_message_twilio(self, mock_client):
        mock_messages = Mock()
        mock_client.return_value.messages.create = mock_messages
        to_numbers = ['1234567890', '9876543210']
        body = "Test Body"
        response = send_sms_message_twilio(to_numbers, body)
        self.assertEqual(len(response), 2)
        for item in response:
            self.assertIn('recipient', item)
            self.assertIn('status', item)

if __name__ == '__main__':
    unittest.main()
