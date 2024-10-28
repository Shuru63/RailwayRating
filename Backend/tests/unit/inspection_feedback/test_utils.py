import unittest
from datetime import datetime
from inspection_feedback.utils import is_valid_date

class TestUtilsIsValidDate(unittest.TestCase):

    def test_valid_date(self):
        # Test with a valid date string
        valid_date_str = '2023-10-10'
        self.assertTrue(is_valid_date(valid_date_str))

    def test_invalid_date(self):
        # Test with an invalid date string
        invalid_date_str = '2023-10-100'  # Invalid day
        self.assertFalse(is_valid_date(invalid_date_str))

    def test_empty_string(self):
        # Test with an empty string
        empty_str = ''
        self.assertFalse(is_valid_date(empty_str))

    def test_none_value(self):
        # Test with None as input
        self.assertFalse(is_valid_date(None))

    def test_datetime_object(self):
        # Test with a datetime object
        valid_datetime = datetime(2023, 10, 10)
        self.assertFalse(is_valid_date(valid_datetime))

if __name__ == '__main__':
    unittest.main()
