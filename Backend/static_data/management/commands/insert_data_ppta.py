from django.core.management.base import BaseCommand
import json

from task.models import Task
from station.models import Station
from shift.models import Shift
from task_shift_occurrence.models import TaskShiftOccurrence
from static_data.utils.funcs import add_time, divide_time


occurrence_list_A = [[2,2,1],[1,1,'NIL'],[2,2,1],[2,2,1],[1,1,1],[1,1,1],[2,2,1],[1,1,'NIL'],[1,1,'NIL'],[1,'NIL','NIL'], [1,'NIL','NIL'],[1,'NIL','NIL'],[1,'NIL','NIL'],[1,'NIL','NIL'],[1,'NIL','NIL'],[3,3,2],[2,2,1],[1,1,1], [1,1,'NIL'],[1,1,'NIL'],[1,'NIL','NIL'],['NIL','NIL',1]]
occurrence_list_B = [[1,1,1],[1,1,1],[1,1,1],[1,1,1],[1,'NIL','NIL'],[1,1,1],[1,1,'NIL']]
occurrence_list_C = [[2,2,1],[1, 'NIL', 'NIL']]


class Command(BaseCommand):
    help = 'Insert data into the database'

    def handle(self, *args, **kwargs):
        # NOTE: We are checking station with its name and id if it is present or not before creating.
        station_name = 'PPTA'
        station_id = 102
        try:
            station, created = Station.objects.update_or_create(
            station_id=station_id,
            station_name=station_name,
            defaults={
                'station_code': 102,
                'chi_id': 102,
                'station_zone': 'Patliputra',
                'station_penalty': 10276.50,
                'name_of_work': "Cleaning, Sanitation & Disinfection Services and Collection & Disposal of Waste Management Service of Patliputra Jn. for 02 years (730 days)",
                'contract_by': "M/S APCON INDIA, F-215, Harsha Complex, Subhash Chowk, Laxmi Nagar, Laxmi Nagar, East Delhi, DELHI-110092",
                'contract_no': "GEMC-511687733643977, Date-07-Dec-2022",
                'station_category': 'A',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"New station created with Station Name: {station_name} & Station ID: {station_id}."))
            else:
                self.stdout.write(self.style.SUCCESS(f"Updated Station: {station_name}."))

            # create shifts for the station
            shifts = open('./static_data/management/commands/Stations(json)/shifts(ppta).json')
            data = json.load(shifts)
            shifts_list = []
            for key, value in data.items():
                shift_each, created = Shift.objects.update_or_create(
                shift_id=value.get('shift_id'),
                station=station,
                defaults={
                    'start_time': value.get('start_time'), 
                    'end_time': value.get('end_time'),
                    'station': station,
                    'created_by': value.get("created_by"),
                    'updated_by': value.get("updated_by")
                    }
                )
                if created:
                    self.stdout.write(f'Created shift for {station_name}: {shift_each.shift_id}')
                else:
                    self.stdout.write(f'Updated shift for {station_name}: {shift_each.shift_id}')
                shifts_list.append(shift_each)

            self.stdout.write(self.style.SUCCESS('Shifts inserted successfully'))

            # create tasks for the station
            tasks = open('./static_data/management/commands/Stations(json)/tasks(ppta).json')
            data = json.load(tasks)
            tasks_list_A = []
            tasks_list_B = []
            tasks_list_C = []

            for key, value in data.items():
                task_obj, created = Task.objects.update_or_create(
                    station=station,
                    task_id=value.get('task_id'),
                    defaults={
                        'task_type': value.get("task_type"),
                        'task_description': value.get('task_description'),
                        'service_type': value.get("service_type"),
                        'cleaning_cycle_days': value.get("cleaning_cycle_days"),
                        'cleaning_cycle_type': value.get("cleaning_cycle_type"),
                        'cleaning_cycle_day_freq': value.get("cleaning_cycle_day_freq"),
                        'created_by': value.get("created_by"),
                        'updated_by': value.get("updated_by")
                    }
                )

                if created:
                    self.stdout.write(f'Created Task for {station_name}: {task_obj.task_id}')
                else:
                    self.stdout.write(f'Updated Task for {station_name}: {task_obj.task_id}')

                if value.get("task_type") == "A":
                    tasks_list_A.append(task_obj)
                    self.stdout.write(self.style.SUCCESS('TasK A inserted successfully'))
                elif value.get("task_type") == "B":
                    tasks_list_B.append(task_obj)
                    self.stdout.write(self.style.SUCCESS('TasK B inserted successfully'))
                elif value.get("task_type") == "C":
                    tasks_list_C.append(task_obj)
                    self.stdout.write(self.style.SUCCESS('TasK C inserted successfully'))

            self.stdout.write(self.style.SUCCESS(f'All tasks inserted successfully for {station_name}'))
            occurrences_list = occurrence_list_A + occurrence_list_B + occurrence_list_C
            tasks_list = tasks_list_A + tasks_list_B + tasks_list_C

            # create occurrences for each shift for a particular task
            for task, i in zip(tasks_list, occurrences_list):
                for shift, j in zip(shifts_list, i):
                    start_time = shift.start_time
                    start_time = add_time(start_time, '02:00:00')
                    if j == 'NIL':
                        is_not_nil = TaskShiftOccurrence.objects.filter(task=task, shift=shift, rating_required=True)
                        if is_not_nil.exists():
                            self.stdout.write(self.style.SUCCESS(f"Occurences of {task} with {shift} Updated"))
                            is_not_nil.delete()

                        end_time = add_time(start_time, '08:00:00')
                        TaskShiftOccurrence.objects.update_or_create(
                            occurrence_id=0,
                            shift=shift,
                            task=task,
                            start_time=start_time,
                            end_time=end_time,
                            rating_required=False
                        )
                    else:
                        occurs = TaskShiftOccurrence.objects.filter(task=task, shift=shift, rating_required=True)
                        if occurs and occurs.count() != j:
                            self.stdout.write(self.style.SUCCESS(f"Occurences of {task} with {shift} Updated"))
                            occurs.delete()
                        is_nil = TaskShiftOccurrence.objects.filter(task=task, shift=shift, rating_required=False)
                        if is_nil.exists():
                            self.stdout.write(self.style.SUCCESS(f"Occurences of {task} with {shift} Updated"))
                            is_nil.delete()

                        diff = divide_time('08:00:00', j)
                        for k in range(1, j+1):
                            end_time = add_time(start_time, diff)
                            if (end_time == '0:00:00'):
                                end_time = '23:59:59'
                            TaskShiftOccurrence.objects.update_or_create(
                                occurrence_id=k,
                                shift=shift,
                                task=task,
                                start_time=start_time,
                                end_time=end_time
                            )
                            start_time = end_time

            self.stdout.write(self.style.SUCCESS(f'Tasks_Shifts inserted for {station_name} successfully'))

        except Station.MultipleObjectsReturned:
            self.stdout.write(self.style.ERROR(f"Multiple stations found for the Station Name: {station_name} or Station ID: {station_id}!"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(repr(e)))
