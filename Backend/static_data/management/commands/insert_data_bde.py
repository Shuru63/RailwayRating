from django.core.management.base import BaseCommand
import json
import csv

from task.models import Task
from station.models import Station
from shift.models import Shift
from task_shift_occurrence.models import TaskShiftOccurrence
from ...utils.funcs import get_occurrence_list


OCCURRENCE_LIST = []


class Command(BaseCommand):
    help = 'Insert data into the database'
    
    def handle(self, *args, **kwargs):
        try:
            stations = open('./static_data/management/commands/Stations(json)/stations_list(BDE).csv')
            csv_reader = csv.DictReader(stations)

            name_of_work = "Cleaning & Sanitation and Disinfection Services 95 nos of stations of B(8 nos), D & E (87 nos)  category stations including 03 nos of colonies i.e. Lakhisrai, Jahanabad & Gulzarbagh along with collection & disposal waste management services i.e. collection,Lifting transportation, unloading segregation of garbage, dry waste for 730 days."
            contract_by = "RAJ INFORMATICS CONSTRUCTION, D N SINGH LANE, B AREA MITHAPUR, Patna, BIHAR 800001, Contact No - 09431055501"
            contract_no = "(i) GEMC-511687749804105, Dated - 17-Feb-2022 (ii) GEMC-511687751091733, Dated - 28-Aug-2023"
            station_penalty = 0.0
            for row in csv_reader:
                station_name = row['station_name']
                station_id = row['station_id']
                station_category = row['station_category']
                station_zone = row['station_zone']
                is_hq = row['is_hq'] == 'Yes'
                is_chi_sm = row['is_chi_sm'] == 'Yes'   # this field checks if the station has same officer for both CHI and Station Manager
                has_indoor_task = row['has_indoor_task'] == 'Yes'
                has_outdoor_task = row['has_outdoor_task'] == 'Yes'
                is_common = row['is_common'] == 'Yes'
                is_active = row['is_active'] == 'Yes'
                if is_common:
                    OCCURRENCE_LIST = [[1], [1]]
                    shifts = open('./static_data/management/commands/Stations(json)/shifts(BDE).json')
                    shifts_data = json.load(shifts)
                    tasks = open('./static_data/management/commands/Stations(json)/tasks(BDE).json')
                    tasks_data = json.load(tasks)
                else:
                    shifts = open(f'./static_data/management/commands/genric/Station(json)/shifts/shifts({station_name.lower()}).json')
                    shifts_data = json.load(shifts)
                    tasks = open(f'./static_data/management/commands/genric/Station(json)/tasks/tasks({station_name.lower()}).json')
                    tasks_data = json.load(tasks)
                    OCCURRENCE_LIST = get_occurrence_list(station_name)
                    if not OCCURRENCE_LIST:
                        self.stdout.write(self.style.ERROR(f'No occurrence list found for {station_name}'))
                station, created = Station.objects.update_or_create(
                    station_id=station_id,
                    defaults={
                        'station_name': station_name,
                        'station_code': station_id,
                        'chi_id': 102,
                        'station_zone': station_zone,
                        'station_penalty': station_penalty,
                        'name_of_work': name_of_work,
                        'contract_by': contract_by,
                        'contract_no': contract_no,
                        'station_category': station_category,
                        'is_hq': is_hq,
                        'is_chi_sm': is_chi_sm,
                        'is_active': is_active,
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"New station created with Station Name: {station_name} & Station ID: {station_id}."))
                else:
                    self.stdout.write(self.style.SUCCESS(f"Updated Station: {station_name}."))

                # create shifts for the station
                shifts_list = []
                for key, value in shifts_data.items():
                    # Shift.objects.filter(shift_id=0, station=station).delete()
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
                tasks_list = []
                for key, value in tasks_data.items():
                    cleaning_cycle_days = value.get("cleaning_cycle_days")
                    cleaning_cycle_day_freq = value.get("cleaning_cycle_day_freq")
                    if not has_indoor_task and value.get('task_description').lower() == 'indoor area':
                        cleaning_cycle_days = 0
                        cleaning_cycle_day_freq = 0
                    task_obj, created = Task.objects.update_or_create(
                        station=station,
                        task_id=value.get('task_id'),
                        defaults={
                            'task_type': value.get("task_type"),
                            'task_description': value.get('task_description'),
                            'service_type': value.get("service_type"),
                            'cleaning_cycle_days': cleaning_cycle_days,
                            'cleaning_cycle_type': value.get("cleaning_cycle_type"),
                            'cleaning_cycle_day_freq': cleaning_cycle_day_freq,
                            'created_by': value.get("created_by"),
                            'updated_by': value.get("updated_by")
                        }
                    )

                    if created:
                        self.stdout.write(f'Created Task for {station_name}: {task_obj.task_id}')
                    else:
                        self.stdout.write(f'Updated Task for {station_name}: {task_obj.task_id}')

                    if value.get("task_type") == "A":
                        tasks_list.append(task_obj)
                        self.stdout.write(self.style.SUCCESS('Task A inserted successfully'))

                self.stdout.write(self.style.SUCCESS(f'All tasks inserted successfully for {station_name}'))

                # create occurrences for each shift for a particular task
                for task, i in zip(tasks_list, OCCURRENCE_LIST):
                    for shift, j in zip(shifts_list, i):
                        if not has_indoor_task:
                            if task.service_type.lower() in ['indoor area'] or task.task_description.lower() in ['indoor area']:
                                j = 'NIL'
                        start_time = shift.start_time
                        end_time = shift.end_time
                        if j == 'NIL':
                            is_not_nil = TaskShiftOccurrence.objects.filter(task=task, shift=shift, rating_required=True)
                            if is_not_nil.exists():
                                self.stdout.write(self.style.SUCCESS(f"Occurences of {task} with {shift} Updated"))
                                is_not_nil.delete()
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

                            for k in range(1, j+1):
                                TaskShiftOccurrence.objects.update_or_create(
                                    occurrence_id=k,
                                    shift=shift,
                                    task=task,
                                    start_time=start_time,
                                    end_time=end_time
                                )
                self.stdout.write(self.style.SUCCESS(f'Tasks_Shifts inserted for {station_name} successfully'))

                shifts.close()
                tasks.close()

            # Assign monitoring stations to each HQ.
            stations.seek(0)    # to move the pointer to the start of the file
            csv_reader = csv.DictReader(stations)
            self.stdout.write(self.style.SUCCESS("Assigning monitoring stations to corresponding HQ Station."))
            for row in csv_reader:
                hq = row['HQ']
                station_name = row['station_name']
                monitoring_station = Station.objects.filter(station_name=station_name).first()
                hq_station = Station.objects.filter(station_name=hq).first()
                if monitoring_station and hq_station:
                    monitoring_station.parent_station = hq_station
                    monitoring_station.save()
                    self.stdout.write(self.style.SUCCESS(f"Assigned monitoring station {station_name} to {hq}"))

            stations.close()
            self.stdout.write(self.style.SUCCESS("Assigned all monitoring stations to corresponding HQ Station."))
            self.stdout.write(self.style.SUCCESS("All done!"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(repr(e)))
