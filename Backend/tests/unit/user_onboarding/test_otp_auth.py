import unittest
from unittest.mock import MagicMock, patch
from user_onboarding.otp_auth import send_otp_request, verify_otp

class TestOTPFunctions(unittest.TestCase):

    @patch('requests.get')
    def test_send_otp_request(self, mock_get):
        mock_get.return_value.json.return_value = {
            "Status": "Success",
            "Details": "session_id"
        }
        result = send_otp_request("1234567890")
        self.assertEqual(result, "session_id")

    @patch('requests.get')
    def test_verify_otp(self, mock_get):
        mock_get.return_value.json.return_value = {
            "Status": "Success",
            "Details": "OTP Matched"
        }
        result = verify_otp("session_id", "1234")
        self.assertTrue(result)

if __name__ == '__main__':
    unittest.main()
