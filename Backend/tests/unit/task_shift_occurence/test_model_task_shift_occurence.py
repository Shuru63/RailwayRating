from django.test import TestCase
from django.utils import timezone
from shift.models import Shift
from station.models import Station
from task.models import Task
from task_shift_occurrence.models import TaskShiftOccurrence

class TaskShiftOccurrenceModelTestCase(TestCase):
    def setUp(self):

        #Create a sample Station
        self.station = Station.objects.create(station_name='Station 1', station_code=1, chi_id=2)

        # Create a sample Shift
        self.shift = Shift.objects.create(
            shift_id=1,
            start_time=timezone.now(),
            end_time=timezone.now(),
            created_by="Admin",
            updated_by="Admin",
            station=self.station
        )

        # Create a sample Task
        self.task = Task.objects.create(
            task_id=1,
            task_description="Sample Task",
            service_type="Service A",
            cleaning_cycle_days=365,  # Once per year
            cleaning_cycle_type="Y",  # Yearly
            cleaning_cycle_day_freq=1,
            station=self.station,
            created_by="Admin",
            updated_by="Admin"
        )

        # Create a sample TaskShiftOccurrence
        self.task_shift_occurrence = TaskShiftOccurrence.objects.create(
            rating_required=True,
            occurrence_id=1,
            start_time=timezone.now(),
            end_time=timezone.now(),
            shift=self.shift,
            task=self.task
        )
        # Updating a TaskShiftOccurrence object with valid data should successfully update the instance in the database.
    def test_update_task_shift_occurrence_with_valid_data(self):
        shift = Shift.objects.create(shift_id=1, start_time=timezone.now(), end_time=timezone.now())
        task = Task.objects.create(task_id=1, task_description="Test Task", service_type="Cleaning", cleaning_cycle_days=30, cleaning_cycle_type="D", cleaning_cycle_day_freq=1)
        occurrence = TaskShiftOccurrence.objects.create(rating_required=True, occurrence_id=1, start_time=timezone.now(), end_time=timezone.now(), shift=shift, task=task)
    
        occurrence.rating_required = False
        occurrence.occurrence_id = 2
        occurrence.start_time = timezone.now() + timezone.timedelta(hours=1)
        occurrence.end_time = timezone.now() + timezone.timedelta(hours=2)
        occurrence.save()
    
        updated_occurrence = TaskShiftOccurrence.objects.get(id=occurrence.id)
    
        self.assertEqual(updated_occurrence.rating_required, False)
        self.assertEqual(updated_occurrence.occurrence_id, 2)
        self.assertEqual(updated_occurrence.start_time, occurrence.start_time)
        self.assertEqual(updated_occurrence.end_time, occurrence.end_time)

    def test_task_shift_occurrence_str_method(self):
        """
        Test the __str__ method of the TaskShiftOccurrence model.
        """
        expected_str = "Sample Task - Shift object (1) - 1"
        self.assertEqual(str(self.task_shift_occurrence), expected_str)

    def test_task_shift_occurrence_attributes(self):
        """
        Test the attributes of the TaskShiftOccurrence model.
        """
        self.assertTrue(self.task_shift_occurrence.rating_required)
        self.assertEqual(self.task_shift_occurrence.occurrence_id, 1)
        # Add more attribute checks as needed...

    def test_task_shift_occurrence_relationships(self):
        """
        Test the relationships of the TaskShiftOccurrence model.
        """
        self.assertEqual(self.task_shift_occurrence.shift, self.shift)
        self.assertEqual(self.task_shift_occurrence.task, self.task)
        # Add more relationship checks as needed...
