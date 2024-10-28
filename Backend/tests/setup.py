from rest_framework_simplejwt.tokens import RefreshToken

from user_onboarding.models import Roles, User, Assign_Permission
from station.models import Station
from task.models import Task
from shift.models import Shift
from task_shift_occurrence.models import TaskShiftOccurrence
from pax_deployed.models import Pax


class TestObjectFactory:
    @staticmethod
    def create_role(name):
        return Roles.objects.create(name=name)


    @staticmethod
    def create_user(username, email, user_type, station, phone):
        return User.objects.create(
            username=username, 
            email=email, 
            user_type=user_type, 
            station=station, phone=phone
            )


    @staticmethod
    def create_station(station_name, station_code, chi_id):
        return Station.objects.create(
            station_name=station_name, 
            station_code=station_code, 
            chi_id=chi_id
            )


    @staticmethod
    def create_task(task_id, task_description, station, cleaning_cycle_days, cleaning_cycle_day_freq):
        return Task.objects.create(
            task_id=task_id, 
            task_description=task_description, 
            station=station, 
            cleaning_cycle_days=cleaning_cycle_days, 
            cleaning_cycle_day_freq=cleaning_cycle_day_freq
            )


    @staticmethod
    def create_shift(shift_id, station, start_time, end_time):
        return Shift.objects.create(
            shift_id=shift_id, 
            station=station, 
            start_time=start_time, 
            end_time=end_time
            )


    @staticmethod
    def create_task_shift_occurrence(task, shift):
        return TaskShiftOccurrence.objects.create(task=task, shift=shift)
    

    @staticmethod
    def create_pax(count, date, shift, user):
        return Pax.objects.create(count=count, date=date, shift=shift, user=user)
    

    @staticmethod
    def create_assign_permission(user):
        return Assign_Permission.objects.create(user=user)
    

    @staticmethod
    def generate_token(user):
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    