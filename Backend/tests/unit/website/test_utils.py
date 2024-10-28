import unittest
from unittest.mock import MagicMock, patch
from user_onboarding.models import Assign_Permission
from datetime import timedelta, date
from website.utils import check_permission, find_occurrence_list,add_time, sub_time, alternate_weekday, alternate_day,add_cycle, delete_cycle, total_occurrences


class TestMyModuleFunctions(unittest.TestCase):

    @patch('website.utils.Assign_Permission.objects.filter')
    def test_check_permission_with_existing_assign_permission(self, mock_filter):
        mock_assign_permission = MagicMock()
        mock_assign_permission.user = "test_user"
        mock_filter.return_value.first.return_value = mock_assign_permission
        result = check_permission("test_user")
        self.assertTrue(result)

    @patch('website.utils.Assign_Permission.objects.filter')
    def test_check_permission_with_non_existing_assign_permission(self, mock_filter):
        mock_filter.return_value.first.return_value = None
        result = check_permission("test_user")
        self.assertFalse(result)

    def test_add_time(self):
        result = add_time("10:30:00", "02:15:30")
        self.assertEqual(result, "12:45:30")




    def test_alternate_weekday(self):
        test_date = date(2023, 1, 16)  # Sample date for testing
        result = alternate_weekday(test_date, 0)  # Assuming '0' corresponds to Monday
        self.assertTrue(result)  # Modify this assertion based on the expected result

    def test_alternate_day(self):
        start_date = date(2023, 1, 1)  # Sample start date for testing
        test_date = date(2023, 1, 15)  # Sample date for testing
        result = alternate_day(start_date, test_date)
        self.assertTrue(result)
    # def test_add_cycle(self):
    #     request = MagicMock()
    #     request.user.station = "TestStation"
    #     dte = "2023-10-10"
    #     task = MagicMock()
    #     task.cleaning_cycle_type = 'B'  # Set the appropriate cleaning cycle type for testing
    #     result = add_cycle(request, dte, task)
    #     self.assertTrue(result)

    # def test_delete_cycle(self):
    #     request = MagicMock()
    #     dte = "2023-10-10"
    #     task = MagicMock()
    #     task.cleaning_cycle_type = 'A'  # Set the appropriate cleaning cycle type for testing
    #     result = delete_cycle(request, dte, task)
    #     self.assertTrue(result)

    # def test_total_occurrences(self):
    #     all_tasks = [MagicMock(id=1), MagicMock(id=2)]  # Ensure that you have valid objects with necessary attributes
    #     all_shifts = [MagicMock(id=1), MagicMock(id=2)]  # Ensure that you have valid objects with necessary attributes
    #     is_curr_shift = True  # Set the appropriate value for testing
    #     result = total_occurrences(all_tasks, all_shifts, is_curr_shift)
    #     self.assertTrue(result >= 0)

if __name__ == '__main__':
    unittest.main()
