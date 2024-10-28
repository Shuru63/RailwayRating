from django.test import TestCase
from station.models import Station
from task.models import Task, CycleDate
import datetime

class TaskModelTestCase(TestCase):
    def setUp(self):
        # Create a sample station
        self.station = Station.objects.create(
            station_name="Sample Station",
            station_id=1,
            station_code=123,
            chi_id=456,
            station_zone="Zone A",
            name_of_work="Work",
            contract_by="Contractor",
            contract_no="12345"
        )

        # Create a sample task
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

        # Create a sample cycle date
        self.cycle_date = CycleDate.objects.create(
            task=self.task,
            cycle_type="Yearly",
            cycle=datetime.date(2023, 1, 1),
            next_cycle=datetime.date(2024, 1, 1),
            station=self.station,
            created_by="Admin",
            updated_by="Admin"
        )

    def test_task_model_str_method(self):
        """
        Test the __str__ method of the Task model.
        """
        expected_str = "Sample Task"
        self.assertEqual(str(self.task), expected_str)

    def test_cycle_date_model_str_method(self):
        """
        Test the __str__ method of the CycleDate model.
        """
        expected_str = "Sample Station - Sample Task - 2023-01-01"
        self.assertEqual(str(self.cycle_date), expected_str)

    def test_task_attributes(self):
        """
        Test the attributes of the Task model.
        """
        self.assertEqual(self.task.task_id, 1)
        self.assertEqual(self.task.task_description, "Sample Task")
        # Add more attribute checks as needed...

    def test_cycle_date_attributes(self):
        """
        Test the attributes of the CycleDate model.
        """
        self.assertEqual(self.cycle_date.cycle_type, "Yearly")
        self.assertEqual(self.cycle_date.cycle, datetime.date(2023, 1, 1))
        # Add more attribute checks as needed...

    def test_task_station_relationship(self):
        """
        Test the relationship between Task and Station.
        """
        self.assertEqual(self.task.station, self.station)
        # Add more relationship checks as needed...

    def test_cycle_date_task_relationship(self):
        """
        Test the relationship between CycleDate and Task.
        """
        self.assertEqual(self.cycle_date.task, self.task)
        # Add more relationship checks as needed...
