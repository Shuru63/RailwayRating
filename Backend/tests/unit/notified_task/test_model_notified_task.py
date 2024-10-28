from django.test import TestCase
from notified_task.models import notified_task

class NotifiedTaskModelTestCase(TestCase):
    def setUp(self):
        # Create a sample notified task
        self.sample_task = notified_task.objects.create(
            task_id=1,
            task_description='Sample Task Description',
            created_by='Test User',
            updated_by='Test User'
        )

    def test_task_creation(self):
        # Retrieve the sample task from the database
        task = notified_task.objects.get(task_id=1)

        # Check if the task was created with the correct values
        self.assertEqual(task.task_id, 1)
        self.assertEqual(task.task_description, 'Sample Task Description')
        self.assertEqual(task.created_by, 'Test User')
        self.assertEqual(task.updated_by, 'Test User')

    def test_task_str_method(self):
        # Check if the __str__ method returns the task description
        task = notified_task.objects.get(task_id=1)
        self.assertEqual(str(task), 'Sample Task Description')

    def test_task_defaults(self):
        # Create a task without specifying all fields (testing defaults)
        default_task = notified_task.objects.create(
            task_description='Default Task'
        )

        # Check if the default values are set correctly
        self.assertEqual(default_task.task_id, 1)  # Default value
        self.assertEqual(default_task.created_by, '')  # Default value
        self.assertEqual(default_task.updated_by, '')  # Default value

    # def test_task_updated_at(self):
    #     # Retrieve the sample task from the database
    #     task = notified_task.objects.get(task_id=1)

    #     # Modify the task's description
    #     task.task_description = 'Updated Task Description'
    #     task.save()

    #     # Refresh the task from the database
    #     updated_task = notified_task.objects.get(task_id=1)

    #     # Check if the updated_at field has changed
    #     self.assertNotEqual(task.updated_at, updated_task.updated_at)

    def test_task_deletion(self):
        # Delete the sample task
        task = notified_task.objects.get(task_id=1)
        task.delete()

        # Attempt to retrieve the deleted task
        with self.assertRaises(notified_task.DoesNotExist):
            notified_task.objects.get(task_id=1)
