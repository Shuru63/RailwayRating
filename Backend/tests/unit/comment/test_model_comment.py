from django.test import TestCase
from user_onboarding.models import User, Roles
from task_shift_occurrence.models import TaskShiftOccurrence
from comment.models import Comment
from tests.setup import TestObjectFactory


class CommentModelTest(TestCase):
    def setUp(self):
        
        factory = TestObjectFactory()

        self.user_type = factory.create_role("supervisor")
        self.station = factory.create_station('Test Station', 1, 2)
        self.user = factory.create_user("testuser", 'test@email.com', self.user_type, self.station, '1234567891')
        factory.create_assign_permission(self.user)
        self.task = factory.create_task('test desc', self.station, 730, 1)
        self.shift = factory.create_shift(self.station, "22:00:00", "06:00:00")
        task_shift_occur_id = factory.create_task_shift_occurrence(self.task, self.shift)

        self.comment = Comment.objects.create(
            text="Test Comment", 
            task_shift_occur_id=task_shift_occur_id, 
            date='2023-11-22', 
            user=self.user
            )


    def test_comment_str(self):
        expected_str = f"Test Comment_{self.user.username}"
        self.assertEqual(str(self.comment), expected_str)


    def test_comment_user_name(self):
        self.assertEqual(self.comment.user_name, self.user.username)


    def test_comment_date(self):
        expected_date = '2023-11-22'
        self.assertEqual(self.comment.date, expected_date)
