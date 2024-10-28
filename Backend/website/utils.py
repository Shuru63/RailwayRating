from datetime import timedelta, date
from dateutil.relativedelta import relativedelta
from django.core.exceptions import ObjectDoesNotExist
import datetime
from django.utils.formats import date_format
import logging
from station.models import Station

from user_onboarding.models import Assign_Permission
from task_shift_occurrence.models import TaskShiftOccurrence
from task.models import Task, CycleDate
from shift.models import Shift
from ratings.models import Rating


def check_permission(user):
    assign = Assign_Permission.objects.filter(user=user).first()
    if assign or user.user_type.name == "railway admin":
        return True
    else:
        return False


def find_occurrence_list(task, shift):
    occurrence_list = []
    for taskk in task:
        list1 = []
        for shiftt in shift:
            list = (TaskShiftOccurrence.objects.filter(
                task=taskk, shift=shiftt).all())
            if (len(list) == 1 and list[0].rating_required == False):
                list1.append('NIL')
            else:
                list1.append(len(list))
        occurrence_list.append(list1)
    return occurrence_list


def valid_task_date(task_id, date):
    return True


def add_time(time1, time2):
    time1 = [int(i) for i in time1.split(":")]
    time2 = [int(i) for i in time2.split(":")]
    time1 = timedelta(hours=time1[0], minutes=time1[1], seconds=time1[2])
    time2 = timedelta(hours=time2[0], minutes=time2[1], seconds=time2[2])
    result = time1 + time2
    result = result - result.days * timedelta(days=1)
    return str(result)


def sub_time(time1, time2):
    time1 = [int(i) for i in time1.split(":")]
    time2 = [int(i) for i in time2.split(":")]
    time1 = timedelta(hours=time1[0], minutes=time1[1], seconds=time1[2])
    time2 = timedelta(hours=time2[0], minutes=time2[1], seconds=time2[2])
    result = time1 - time2
    result = result - result.days * timedelta(days=1)
    return str(result)


def alternate_weekday(dte, weekday):
    start_date = date(2023, 1, 1)
    today = dte

    current_date = start_date
    while current_date < today:
        if current_date.weekday() == weekday:
            current_date += timedelta(days=14)
        else:
            current_date += timedelta(days=1)

    if current_date == today and today.weekday() == weekday:
        # print(current_date)
        return True
    else:
        # print(current_date)
        return False


def alternate_day(start_date, dte):
    '''
    To find alternate days for a given date.

    '''
    diff = abs((dte - start_date).days)

    if diff % 2 == 0:
        return True
    else:
        return False


def update_rating_status(username: str, station: Station, date: str):
    '''
    Updates the 'rating_required' field for non-daily tasks.

    This function iterates over all tasks for a given station that have a cleaning cycle type 
    in ['A', 'B', 'BW', 'F', 'H', 'M', 'Q', 'Y']. For each task, it checks if a CycleDate object 
    exists for the task and the given date. Then, it iterates over all occurrences of the task 
    for each shift at the station. Depending on the cleaning cycle type of the task and other conditions, 
    it sets the 'rating_required' field of the occurrence and adds the occurrence to a list. 
    Finally, it updates the 'rating_required' field of all occurrences in the list in the database.

    Args:
        username (str): The username of the user.
        station (Station): The station for which to update the tasks.
        date (str): The date for which to update the tasks, in the format '%Y-%m-%d'.

    Raises:
        Exception: If an error occurs while updating the tasks, an exception is raised and logged.
    '''
    try:
        date_object = datetime.datetime.strptime(date, '%Y-%m-%d')
        day = date_object.weekday()
        shifts = Shift.objects.filter(station=station).prefetch_related('occurrences').all().order_by('shift_id')
        all_tasks = Task.objects.filter(station=station).all().order_by('task_id')

        cleaning_cycle_types = ['A', 'B', 'BW', 'F', 'H', 'M', 'Q', 'W', 'Y']
        tasks = all_tasks.filter(cleaning_cycle_type__in=cleaning_cycle_types)
        occurrences_to_update = []
        for task in tasks:
            cycle_exists = CycleDate.objects.filter(task=task, cycle=date).exists()
            for shift in shifts:
                occurs = shift.occurrences.exclude(occurrence_id=0).filter(task=task).all()  # type: ignore
                for occur in occurs:
                    rating_required = False
                    if task.cleaning_cycle_type == 'A':
                        is_alternate_day = alternate_day(task.alternate_day_start, datetime.datetime.date(date_object))
                        if is_alternate_day or cycle_exists:
                            if not cycle_exists:
                                add_cycle(username, station, date, task)
                            rating_required = True
                    elif task.cleaning_cycle_type == 'BW':
                        if day == int(task.weekday) or day == int(task.biweekday) or cycle_exists:  # type: ignore
                            if not cycle_exists:
                                add_cycle(username, station, date, task)
                            rating_required = True
                    elif task.cleaning_cycle_type == 'F':
                        if alternate_weekday(
                            datetime.datetime.date(date_object), 
                            int(task.weekday) or cycle_exists):  # type: ignore
                            if not cycle_exists:
                                add_cycle(username, station, date, task)
                            rating_required = True
                    elif task.cleaning_cycle_type == 'W':
                        if day == int(task.weekday) or cycle_exists:  # type: ignore
                            if not cycle_exists:
                                add_cycle(username, station, date, task)
                            rating_required = True
                    elif task.cleaning_cycle_type in ['H', 'B', 'M', 'Q', 'Y']:
                        try:
                            next_cycle = task.cycles.order_by('cycle').last().next_cycle    # type: ignore
                            if str(date) == str(next_cycle):
                                add_cycle(username, station, date, task)
                        except Exception as e:
                            pass
                        if cycle_exists:
                            rating_required = True

                    occur.rating_required = rating_required
                    occurrences_to_update.append(occur)

        # Updating the rating_required field for the TaskShiftOccurrence table.
        TaskShiftOccurrence.objects.bulk_update(occurrences_to_update, ['rating_required'])

    except Exception as e:
        logging.exception(f"An error occurred in update_rating_status: {repr(e)}")


def add_cycle(username, station, dte, task):
    '''
    To add the available cycles and next available cycles of non daily tasks.

    '''
    cycle_type = task.cleaning_cycle_type

    try:
        obj, created = CycleDate.objects.get_or_create(
            task=task,
            cycle_type=cycle_type,
            cycle=dte,
            station=station,
            defaults={'created_by': username}
        )
        start_date = datetime.datetime.strptime(dte, "%Y-%m-%d").date()
        if created:
            next_cycle = None
            if cycle_type in ['B', 'H']:
                next_cycle = start_date + relativedelta(months=+6)
            elif cycle_type == 'Q':
                next_cycle = start_date + relativedelta(months=+3)
            elif cycle_type == 'M':
                next_cycle = start_date + relativedelta(months=+1)
            elif cycle_type == 'Y':
                next_cycle = start_date + relativedelta(months=+12)
            elif cycle_type == 'A':
                next_cycle = start_date + relativedelta(days=+2)

            obj.next_cycle = next_cycle
            obj.save()
        return True

    except Exception as e:
        logging.exception(f"An error occurred in add_cycle: {repr(e)}")
        return False


def delete_cycle(username: str, station: Station, dte: str, task: Task):
    '''
    To delete the cycle of a particular task.

    '''
    try:
        if task_cycle := CycleDate.objects.filter(task=task, cycle=dte):
            task_cycle.delete()
            
        if task.cleaning_cycle_type == 'A':
            start_date = datetime.datetime.strptime(dte, "%Y-%m-%d").date()
            task.alternate_day_start = start_date + relativedelta(days=+1)
            task.save()

            obj, created = CycleDate.objects.get_or_create(
                task=task,
                cycle_type='A',
                cycle=start_date + relativedelta(days=+1),
                station=station,
                next_cycle=start_date + relativedelta(days=+3),

                defaults={'created_by': username}
                )
                
        return True
        
    except ObjectDoesNotExist:
        logging.exception("Cycle does not exist")
        return False
    
    except Exception as e:
        logging.exception(f"An error occurred in delete_cycle: {repr(e)}")
        return False    


def total_occurrences(station, shift, is_curr_shift):
    '''
    Returns total number of available occurrences present in a station.

    '''
    try:
        if not is_curr_shift:
            occurs = TaskShiftOccurrence.objects.filter(task__station=station, rating_required=True).count()
            return occurs

        else:
            occurs = TaskShiftOccurrence.objects.filter(task__station=station, shift=shift, rating_required=True).count()
            return occurs
    
    except Exception as e:
        logging.exception(f"An error occurred in total_occurrences: {repr(e)}")


def get_cycles(station):
    '''
    To retieve cycle dates of non-daily tasks of a station.

    '''
    cycles = {}
    try:
        all_tasks = Task.objects.filter(station=station).order_by('task_id').all()
        for task in all_tasks:
            if task.cleaning_cycle_type != 'D':
                if CycleDate.objects.filter(task=task).exists():
                    next_cycle = CycleDate.objects.filter(task=task).order_by('next_cycle').last().next_cycle
                    last_enabled = CycleDate.objects.filter(task=task).order_by('cycle').last().cycle
                    cycles[task.task_id] = {
                        "task": task.task_description,
                        "cycle_type": task.cleaning_cycle_type,
                        "next_cycle": next_cycle,
                        "last_enabled": last_enabled
                    }
                else:
                    cycles[task.task_id] = {
                        "task": task.task_description,
                        "cycle_type": task.cleaning_cycle_type,
                        "next_cycle": None,
                        "last_enabled": None
                    }
        return cycles
    
    except Exception as e:
        logging.exception(f"An error occurred in get_cycles: {repr(e)}")


def completed_tasks(station, date, curr_shift):
    '''
    To find the number of completed tasks in a date
    '''
    completed = 0
    try:
        occurs = TaskShiftOccurrence.objects.filter(task__station=station, rating_required=True)
        if curr_shift:
            occurs = occurs.filter(shift=curr_shift)

        for occur in occurs:
            is_rated = Rating.objects.filter(task_shift_occur_id=occur, date=date).last()
            if is_rated and is_rated.task_status == 'completed':
                completed +=1

        return completed
    
    except Exception as e:
        logging.exception(f"Error occurred in completed_tasks: {repr(e)}")
