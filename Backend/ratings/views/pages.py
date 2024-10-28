import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core import serializers
from datetime import timedelta
import datetime
from django.utils.formats import date_format
from django.utils.dateparse import parse_datetime
from django_ratelimit.decorators import ratelimit
import re

from website.decorators import allowed_users
from website.utils import (
    check_permission, 
    find_occurrence_list, 
    alternate_weekday, 
    alternate_day, 
    total_occurrences, 
    get_cycles, 
    completed_tasks, 
    update_rating_status
    )
from ..models import Rating
from ..serializers import GetRatingsSerializer
from task_shift_occurrence.models import TaskShiftOccurrence
from task.models import Task, CycleDate
from shift.models import Shift, Verified_shift
from comment.models import Comment
from file_upload.models import Media
from pax_deployed.models import Pax


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer', 'chi_sm'])
def rating_details(request):
    """
    Retrieve data related to ratings for tasks and shifts for a particular day and return a response containing the data.

    Inputs:
    - request: The HTTP request object containing information about the request made to the API.

    Outputs:
    - Response: A response containing a dictionary with various data related to tasks, shifts, occurrences, ratings, and other related models.
    """
    try:
        today = datetime.datetime.now()
        if today.time() >= datetime.time(22, 0, 0):
            today = (datetime.datetime.now() + timedelta(days=1)).date()
        date = today.strftime('%Y-%m-%d')
        if request.method == 'POST':
            post_date = request.data.get('date')
            if not post_date:
                return Response({'error': "Please Select Date"}, status=status.HTTP_400_BAD_REQUEST)
            post_date = parse_datetime(post_date)
            date = post_date.strftime('%Y-%m-%d')
        
        user = request.user
        check = check_permission(user)
        role = user.user_type
        station = user.station
        station_json = serializers.serialize('json', [station])
        user_json = serializers.serialize('json', [request.user])
        date_object = datetime.datetime.strptime(date, '%Y-%m-%d')
        day = date_format(date_object, 'l')
        update_rating_status(request.user.username, station, date)

        all_tasks = Task.objects.filter(station=station).order_by('task_id')
        all_shifts = Shift.objects.filter(station=station).order_by('shift_id')
        total_occurs = total_occurrences(station, None, False)
        completed_task_nos = completed_tasks(station, date, None)
        is_pending_tasks = completed_task_nos != total_occurs

        sup = role.name
        if check:
            task_A = all_tasks.filter(
                task_type='A').order_by('task_id').values_list()
            task_B = all_tasks.filter(
                task_type='B').order_by('task_id').values_list()
            task_C = all_tasks.filter(
                task_type='C').order_by('task_id').values_list()

            occurrence_list_A = find_occurrence_list(task_A, all_shifts)
            occurrence_list_B = find_occurrence_list(task_B, all_shifts)
            occurrence_list_C = find_occurrence_list(task_C, all_shifts)

            ratings = Rating.objects.filter(
                date=date,
                task_shift_occur_id__task__station=station).all().values_list()
            task_shift_occurs = TaskShiftOccurrence.objects.filter(
                task__station=station).order_by('task__task_id').values_list()
            cycles = get_cycles(station)

            mobile_device = 1
            try:
                if (request.COOKIES['device'] == 'larger'):
                    mobile_device = 0
            except:
                pass

            pax = []
            verified_shifts = [False, False, False]
            all_marked_shift = [True, True, True]
            verified_shift_num = 0
            for shift_object in all_shifts:
                # Pax deployment
                if Pax.objects.filter(shift=shift_object, date=date).first():
                    pax.append(Pax.objects.filter(
                        shift=shift_object, date=date).last().count)
                else:
                    pax.append(0)
                
                # Shift verification
                verified_objects = Verified_shift.objects.filter(
                    shift=shift_object,
                    verified_shift_date=date,
                )
                verified_object = False
                if sup in ['supervisor', 'chi_sm']:
                    verified_object = verified_objects.filter(
                        verified_by__user_type__name__in=['supervisor', 'chi_sm']).last()
                elif sup == 'contractor':
                    verified_object = verified_objects.filter(
                        verified_by__user_type__name=sup).last()
                else:
                    verified_shifts[verified_shift_num] = False
                
                if verified_object:
                    verified_shifts[verified_shift_num] = verified_object.verification_status
                for task in all_tasks:
                    for occurrence in TaskShiftOccurrence.objects.filter(
                        task=task, 
                        shift=shift_object, 
                        rating_required=True
                        ):
                        is_rating = Rating.objects.filter(
                            date=date, 
                            task_shift_occur_id=occurrence).last()
                        if not is_rating or is_rating.task_status == 'pending':
                                all_marked_shift[verified_shift_num] = False

                verified_shift_num += 1
            pax1 = pax[0]
            pax2 = []
            pax3 = []
            if station.station_category in ['A', 'A1']:
                pax2 = pax[1]
                pax3 = pax[2]

            task_media_dict = {}
            for task in all_tasks:
                task_media_dict[task.task_id] = {}
                for shift_object in all_shifts:
                    task_media_dict[task.task_id][shift_object.shift_id] = {}
                    for occurrence in TaskShiftOccurrence.objects.filter(task=task, shift=shift_object):
                        task_media_dict[task.task_id][shift_object.shift_id][occurrence.occurrence_id] = False
                        is_rating = Rating.objects.filter(
                            date=date, 
                            task_shift_occur_id=occurrence).last()
                        media_exists = Media.objects.filter(
                            task_shift_occur_id=occurrence, date=date).exists()
                        if is_rating:
                            if is_rating.task_status == 'pending' and media_exists:
                                    task_media_dict[task.task_id][shift_object.shift_id][occurrence.occurrence_id] = True
                        elif not is_rating and media_exists:
                            task_media_dict[task.task_id][shift_object.shift_id][occurrence.occurrence_id] = True

            all_shifts_verified = False
            if (verified_shifts[0] == True and verified_shifts[1] == True and verified_shifts[2] == True):
                all_shifts_verified = True
            date_str = datetime.datetime.strptime(date, '%Y-%m-%d')
            formatted_date = date_str.strftime('%d-%m-%Y')
            dateStation = [date, station_json]

            context = {'sup': sup, 'pax1': pax1, 'pax2': pax2, 'pax3': pax3, 'task_A': task_A, 'task_B': task_B, 'task_C': task_C, 'shift': all_shifts.values_list(), 'date': date, 'occurrence_list_A': occurrence_list_A, 'occurrence_list_B': occurrence_list_B, 'occurrence_list_C': occurrence_list_C, 'station': station_json, 'mobile_device': mobile_device, 'task_media_dict': task_media_dict, 'is_pending_tasks': is_pending_tasks, 'dateStation': dateStation, 'all_tasks': all_tasks.values_list(), 'day': day, "ratings": ratings, "task_shift_occurs": task_shift_occurs, 'verified_shifts': verified_shifts, 'all_shifts_verified': all_shifts_verified, 'all_marked_shift': all_marked_shift, 'formatted_date': formatted_date, 'cycles': cycles, "user": user_json}

            return Response(context, status=status.HTTP_200_OK)

        else:
            message = "You don't have permission to view this page"
            logging.exception(message)
            return Response({'message': message}, status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        logging.exception(f"An error occurred in rating_details: {repr(e)}")
        return Response({"message": "An error occurred in Write Score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer'])
def curr_shift(request):
    try:
        station = request.user.station
        station_json = serializers.serialize('json', [station])
        user = request.user
        role = user.user_type
        sup = role.name
        check = check_permission(user)
        if check:
            today = datetime.datetime.now()
            date = today.strftime('%Y-%m-%d')
            formatted_date = today.strftime('%d-%m-%Y')
            current_time1 = today.time()
            if current_time1 >= datetime.time(22, 0, 0):
                current_date1 = (today + timedelta(days=1)).date()
            else:
                current_date1 = today.date()
            date = current_date1.strftime('%Y-%m-%d')
            date_object = datetime.datetime.strptime(date, '%Y-%m-%d')
            day = date_format(date_object, 'l')
            hours = today.hour
            curr_shift = 1

            if hours >= 6 and hours < 14:
                curr_shift = 1
            elif hours >= 14 and hours < 22:
                curr_shift = 2
            elif hours >= 22 or hours < 6:
                curr_shift = 3

            Taskshift_list_A = []
            Taskshift_list_B = []
            Taskshift_list_C = []
            task_A = Task.objects.filter(
                station=station, task_type='A').all().order_by('task_id').values_list()
            task_B = Task.objects.filter(
                station=station, task_type='B').all().order_by('task_id').values_list()
            task_C = Task.objects.filter(
                station=station, task_type='C').all().order_by('task_id').values_list()
            shift = Shift.objects.filter(
                station=station, shift_id=curr_shift).first()

            all_tasks = Task.objects.filter(station=station).order_by('task_id')
            total_occurs = total_occurrences(station, shift, True)
            # print("Total Occurs: ", total_occurs)
            completed_task_nos = completed_tasks(station, date, shift)
            # print(f"Completed: {completed_task_nos}")

            is_pending_tasks = completed_task_nos != total_occurs
            all_marked_shift = not is_pending_tasks
            cycles = get_cycles(station)
            update_rating_status(request.user.username, station, date)

            for task in task_A:
                task_shift = TaskShiftOccurrence.objects.filter(
                    task=task, shift=shift).all().values_list()
                Taskshift_list_A.append(task_shift)
            for task in task_B:
                task_shift = TaskShiftOccurrence.objects.filter(
                    task=task, shift=shift).all().values_list()
                Taskshift_list_B.append(task_shift)
            for task in task_C:
                task_shift = TaskShiftOccurrence.objects.filter(
                    task=task, shift=shift).all().values_list()
                Taskshift_list_C.append(task_shift)

            shift_pax = Pax.objects.filter(shift=shift, date=date).last()
            if shift_pax:
                pax = shift_pax.count
                pax_status = shift_pax.Pax_status
            else:
                pax = 0
                pax_status = 'Pending'
            mobile_device = 1
            try:
                if (request.COOKIES['device'] == 'larger'):
                    mobile_device = 0
            except:
                pass

            def extract_value_from_string(input_string):
                pattern = r"\((\d+)\)"
                match = re.search(pattern, input_string)
                if match:
                    return int(match.group(1))
                else:
                    return None

            task_media_dict = {}
            for task in all_tasks:
                task_media_dict[task.task_id] = {}
                for occurrence in TaskShiftOccurrence.objects.filter(task=task, shift=shift):
                    is_rating = Rating.objects.filter(
                        date=date, 
                        task_shift_occur_id=occurrence).last()
                    media_exists = Media.objects.filter(
                            task_shift_occur_id=occurrence, date=date).exists()
                    task_media_dict[task.task_id][occurrence.occurrence_id] = False
                    if is_rating:
                        if is_rating.task_status == 'pending' and media_exists:
                            task_media_dict[task.task_id][occurrence.occurrence_id] = True
                    elif not is_rating and media_exists:
                        task_media_dict[task.task_id][occurrence.occurrence_id] = True

            ratings = Rating.objects.filter(
                task_shift_occur_id__shift=shift,
                date=date,
                task_shift_occur_id__shift__station=station).all().values_list()

            verified = False
            verified_shift = Verified_shift.objects.filter(
                shift=shift,
                verified_shift_date=date,
                verified_by__user_type__name=user.user_type.name).last()
            if verified_shift:
                verified = verified_shift.verification_status

            dateStation = [date, station_json]
            context = {'pax_status': pax_status, 'pax': pax, 'sup': sup, 'task_A': task_A, 'task_B': task_B, 'task_C': task_C, 'date': date, 'Taskshift_list_A': Taskshift_list_A, 'Taskshift_list_B': Taskshift_list_B, 'Taskshift_list_C': Taskshift_list_C, 'curr_shift': curr_shift, 'station': station_json, 'mobile_device': mobile_device, 'task_media': task_media_dict, "dateStation": dateStation, 'ratings': ratings, 'formatted_date': formatted_date, 'is_pending_tasks': is_pending_tasks, 'all_tasks': all_tasks.values(), 'day': day, "verified": verified, "all_marked_shift": all_marked_shift, 'cycles': cycles}

            return Response(context, status=status.HTTP_200_OK)
        else:
            message = "You don't have permission to view this page"
            logging.error(message)
            return Response({'message': message}, status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        logging.exception(f"An error occurred in curr_shift: {repr(e)}")
        return Response({"message": "An error occurred in Write Shift"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer', 'chi_sm'])
def add_rating(request, date, task_id, shift_id, occurrence_id):
    try:
        user = request.user
        user_json = serializers.serialize('json', [user])
        station = request.user.station
        station_json = serializers.serialize('json', [station])
        station_name = station.station_name
        check = check_permission(user)
        if request.session.get('prev_page') is None:
            prev_page = 'Today'
        else:
            prev_page = request.session.get('prev_page').split('/')[-1]

        if check:
            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
                task = Task.objects.get(task_id=task_id, station=station)
                occurrence_obj = TaskShiftOccurrence.objects.get(
                    shift=shift, task=task, occurrence_id=occurrence_id)

            except (Shift.DoesNotExist, Task.DoesNotExist, TaskShiftOccurrence.DoesNotExist) as e:
                logging.exception(f"Object not found: {repr(e)}")
                return Response({"message": "Object not found"}, status=status.HTTP_404_NOT_FOUND)

            task_dict = Task.objects.filter(
                station=station, task_id=task_id).values().first()
            shift_dict = Shift.objects.filter(
                station=station, shift_id=shift_id).values().first()
            occurrence_obj_dict = TaskShiftOccurrence.objects.filter(
                task=task, shift=shift, occurrence_id=occurrence_id).values().first()

            task_count = Task.objects.filter(station=station).count()
            shift_count = TaskShiftOccurrence.objects.filter(
                task=task, shift=shift).count()
            shift_num = shift.shift_id
            task_num = task.task_id
            # occurrence_count = TaskShiftOccurrence.objects.filter(task=task, shift=shift, occurrence_id=occurrence_id).count()
            # print(occurrence_count)

            ##########################################  For side btns  ##########################################

            if occurrence_id + 1 <= shift_count:
                next_occur_shift = Shift.objects.filter(
                    station=station, shift_id=shift_num).first().shift_id
                next_occur_task = Task.objects.filter(
                    station=station, task_id=task_num).first().task_id
                next_occurrence = occurrence_id + 1
            else:
                next_occur_task = None
                next_occur_shift = None
                next_occurrence = None

            if shift_id == 1:
                next_shift = Shift.objects.filter(
                    station=station, shift_id=2).first()
                prev_shift = Shift.objects.filter(
                    station=station, shift_id=3).first()
            elif shift_id == 2:
                next_shift = None
                prev_shift = Shift.objects.filter(
                    station=station, shift_id=1).first()
            else:
                next_shift = Shift.objects.filter(
                    station=station, shift_id=1).first()
                prev_shift = None

            next_shift_task = task_id
            next_shift_occur = 1
            next_shift_num = None
            if next_shift:
                next_shift_num = next_shift.shift_id

                is_next_shift_occur = TaskShiftOccurrence.objects.filter(
                    task=task, shift=next_shift, occurrence_id=1).exists()

                if is_next_shift_occur:
                    next_shift = next_shift_num
                else:
                    next_shift = None

                if not is_next_shift_occur and next_shift_num == 1:
                    next_shift = Shift.objects.filter(
                        station=station, shift_id=2).first()
                    if TaskShiftOccurrence.objects.filter(
                            task=task, shift=next_shift, occurrence_id=1).exists():
                        next_shift = next_shift.shift_id
                    else:
                        next_shift = None
                        next_shift_task = None
                        next_shift_occur = None

            next_task = None
            next_task_shift = shift_id
            next_task_occur = 1
            next = False
            if task_num < task_count:
                for i in range(task_num + 1, task_count + 1):
                    next_task = Task.objects.filter(
                        station=station, task_id=i).first()

                    if TaskShiftOccurrence.objects.filter(
                            task=next_task, shift=shift, occurrence_id=1).exists():
                        next_task = next_task.task_id
                        next_task_occur = 1
                        next = True
                        break
            if not next:
                next_task = None

            prev_shift_task = task_id
            prev_shift_occur = 1
            prev_shift_num = None
            if prev_shift:
                prev_shift_num = prev_shift.shift_id

                is_prev_shift_occur = TaskShiftOccurrence.objects.filter(
                    task=task, shift=prev_shift, occurrence_id=1).exists()

                if is_prev_shift_occur:
                    prev_shift = prev_shift_num
                else:
                    prev_shift = None

                if not is_prev_shift_occur and prev_shift_num == 1:
                    prev_shift = Shift.objects.filter(
                        station=station, shift_id=3).first()
                    if TaskShiftOccurrence.objects.filter(
                            task=task, shift=prev_shift, occurrence_id=1).exists():
                        prev_shift = prev_shift.shift_id
                    else:
                        prev_shift = None
                        prev_shift_task = None
                        prev_shift_occur = None

            prev_task = None
            prev_task_shift = shift_id
            prev_task_occur = 1
            prev = False
            if task_num > 1:
                for i in range(task_num - 1, 0, -1):
                    prev_task = Task.objects.filter(
                        station=station, task_id=i).first()
                    if TaskShiftOccurrence.objects.filter(
                            task=prev_task, shift=shift, occurrence_id=1).exists():
                        prev_task = prev_task.task_id
                        prev_task_occur = 1
                        prev = True
                        break
            if not prev:
                prev_task = False

            if prev_page == 'currShift':
                next_shift = None
                prev_shift = None

            date_object = datetime.datetime.strptime(date, '%Y-%m-%d')
            day = date_format(date_object, 'l')
            day_num = date_object.weekday()
            is_alternate_day = False
            weekday = False
            biweekly = False

            next_task_is_19 = False
            prev_task_is_19 = False
            next_task_is_23 = False
            prev_task_is_23 = False
            next_task_is_25 = False
            prev_task_is_25 = False
            enable_task_25 = False
            if station_name == 'PNBE':
                if next_task == 19:
                    next_task_is_19 = Task.objects.filter(
                        station=station, task_id=19).values().first()

                if prev_task == 19:
                    prev_task_is_19 = Task.objects.filter(
                        station=station, task_id=19).values().first()

                if next_task == 23:
                    next_task_is_23 = Task.objects.filter(
                        station=station, task_id=23).values().first()

                if prev_task == 23:
                    prev_task_is_23 = Task.objects.filter(
                        station=station, task_id=23).values().first()

                if next_task == 25:
                    next_task_is_25 = True

                if prev_task == 25:
                    prev_task_is_25 = True
                    task_23 = Task.objects.filter(
                        station=station, task_id=23).first()
                    if day_num == int(task_23.weekday) and alternate_weekday(
                            datetime.datetime.date(date_object), int(task_23.weekday)):
                        weekday = True

                task_25 = Task.objects.get(station=station, task_id=25)
                if CycleDate.objects.filter(task=task_25, cycle=date).exists():
                    enable_task_25 = True

            next_task_is_11 = False
            prev_task_is_11 = False
            next_task_is_15 = False
            prev_task_is_15 = False
            next_task_is_16 = False
            prev_task_is_16 = False
            next_task_is_18 = False
            prev_task_is_18 = False
            enable_task_16 = False
            enable_task_18 = False
            if station_name == 'DNR':
                if next_task == 11:
                    next_task_is_11 = Task.objects.filter(
                        station=station, task_id=11).values().first()

                if prev_task == 11:
                    prev_task_is_11 = Task.objects.filter(
                        station=station, task_id=11).values().first()

                if next_task == 15:
                    next_task_is_15 = Task.objects.filter(
                        station=station, task_id=15).values().first()

                if prev_task == 15:
                    prev_task_is_15 = Task.objects.filter(
                        station=station, task_id=15).values().first()

                if Task.objects.filter(station=station, task_id=15).first().get_weekday_display() == day:
                    weekday = True

                if next_task == 16:
                    next_task_is_16 = True

                if prev_task == 16:
                    prev_task_is_16 = True

                if next_task == 18:
                    next_task_is_18 = True

                if prev_task == 18:
                    prev_task_is_18 = True

                task_16 = Task.objects.get(station=station, task_id=16)
                if CycleDate.objects.filter(task=task_16, cycle=date).exists():
                    enable_task_16 = True

                task_18 = Task.objects.get(station=station, task_id=18)
                if CycleDate.objects.filter(task=task_18, cycle=date).exists():
                    enable_task_18 = True

            next_task_is_12 = False
            prev_task_is_12 = False
            next_task_is_14 = False
            prev_task_is_14 = False
            next_task_is_21 = False
            prev_task_is_21 = False
            enable_task_14 = False
            enable_task_21 = False
            if station_name == 'PPTA':
                if next_task == 12:
                    next_task_is_12 = Task.objects.filter(
                        station=station, task_id=12).values().first()

                if prev_task == 12:
                    prev_task_is_12 = Task.objects.filter(
                        station=station, task_id=12).values().first()

                if next_task == 14:
                    next_task_is_14 = True

                if prev_task == 14:
                    prev_task_is_14 = True

                if next_task == 21:
                    next_task_is_21 = True

                if prev_task == 21:
                    prev_task_is_21 = True

                task_14 = Task.objects.get(station=station, task_id=14)
                if CycleDate.objects.filter(task=task_14, cycle=date).exists():
                    enable_task_14 = True

                task_21 = Task.objects.get(station=station, task_id=21)
                if CycleDate.objects.filter(task=task_21, cycle=date).exists():
                    enable_task_21 = True

            next_task_is_9_pnc = False
            prev_task_is_9_pnc = False
            next_task_is_19_pnc = False
            prev_task_is_19_pnc = False
            enable_task_19_pnc = False
            if station_name == 'PNC':
                if next_task == 9:
                    next_task_is_9_pnc = Task.objects.filter(
                        station=station, task_id=9).values().first()

                if prev_task == 9:
                    prev_task_is_9_pnc = Task.objects.filter(
                        station=station, task_id=9).values().first()

                if next_task == 19:
                    next_task_is_19_pnc = True

                if prev_task == 19:
                    prev_task_is_19_pnc = True

                task_19 = Task.objects.get(station=station, task_id=19)
                if CycleDate.objects.filter(task=task_19, cycle=date).exists():
                    enable_task_19_pnc = True

            next_task_is_4_kiul = False
            prev_task_is_4_kiul = False
            enable_task_4_kiul = False
            next_task_is_11_kiul = False
            prev_task_is_11_kiul = False
            next_task_is_13_kiul = False
            prev_task_is_13_kiul = False
            next_task_is_17_kiul = False
            if station_name == 'KIUL':
                if next_task == 4:
                    next_task_is_4_kiul = True

                if prev_task == 4:
                    prev_task_is_4_kiul = True

                task_4 = Task.objects.get(station=station, task_id=4)
                if CycleDate.objects.filter(task=task_4, cycle=date).exists():
                    enable_task_4_kiul = True

                task_11 = Task.objects.get(station=station, task_id=11)
                is_alternate_day = alternate_day(
                    task_11.alternate_day_start, datetime.datetime.date(date_object))
                if next_task == 11:
                    next_task_is_11_kiul = True

                if prev_task == 11:
                    prev_task_is_11_kiul = True

                if next_task == 13:
                    next_task_is_13_kiul = Task.objects.filter(
                        station=station, task_id=13).values().first()

                if prev_task == 13:
                    prev_task_is_13_kiul = Task.objects.filter(
                        station=station, task_id=13).values().first()

                if next_task == 17:
                    next_task_is_17_kiul = Task.objects.filter(
                        station=station, task_id=17).values().first()

            prev_task_is_10_jmu = False
            next_task_is_10_jmu = False
            prev_task_is_11_jmu = False
            next_task_is_11_jmu = False
            prev_task_is_19_jmu = False
            next_task_is_19_jmu = False
            enable_task_19_jmu = False
            prev_task_is_24_jmu = False
            next_task_is_24_jmu = False
            if station_name == 'JMU':
                if next_task == 10:
                    next_task_is_10_jmu = Task.objects.filter(
                        station=station, task_id=10).values().first()
                    if Task.objects.filter(station=station, task_id=11).first().get_weekday_display() == day:
                        weekday = True

                if prev_task == 10:
                    prev_task_is_11_jmu = Task.objects.filter(
                        station=station, task_id=10).values().first()

                if next_task == 11:
                    next_task_is_11_jmu = Task.objects.filter(
                        station=station, task_id=11).values().first()

                if prev_task == 11:
                    prev_task_is_11_jmu = Task.objects.filter(
                        station=station, task_id=11).values().first()
                    if Task.objects.filter(station=station, task_id=10).first().get_weekday_display() == day:
                        weekday = True

                if next_task == 19:
                    next_task_is_19_jmu = True

                if prev_task == 19:
                    prev_task_is_19_jmu = True

                task_19 = Task.objects.get(station=station, task_id=19)
                if CycleDate.objects.filter(task=task_19, cycle=date).exists():
                    enable_task_19_jmu = True

                if prev_task == 24:
                    prev_task_is_24_jmu = Task.objects.filter(
                        station=station, task_id=24).values().first()

                if next_task == 24:
                    next_task_is_24_jmu = Task.objects.filter(
                        station=station, task_id=24).values().first()

            prev_task_is_10_bkp = False
            next_task_is_10_bkp = False
            prev_task_is_19_bkp = False
            next_task_is_19_bkp = False
            enable_task_19_bkp = False
            prev_task_is_21_bkp = False
            next_task_is_21_bkp = False
            enable_task_21_bkp = False
            if station_name == 'BKP':
                if next_task == 10:
                    next_task_is_10_bkp = Task.objects.filter(
                        station=station, task_id=10).values().first()

                if prev_task == 10:
                    prev_task_is_10_bkp = Task.objects.filter(
                        station=station, task_id=10).values().first()

                if next_task == 19:
                    next_task_is_19_bkp = True

                if prev_task == 19:
                    prev_task_is_19_bkp = True

                task_19 = Task.objects.get(station=station, task_id=19)
                if CycleDate.objects.filter(task=task_19, cycle=date).exists():
                    enable_task_19_bkp = True

                if next_task == 21:
                    next_task_is_21_bkp = True

                if prev_task == 21:
                    prev_task_is_21_bkp = True

                task_21 = Task.objects.get(station=station, task_id=21)
                if CycleDate.objects.filter(task=task_21, cycle=date).exists():
                    enable_task_21_bkp = True

            prev_task_is_17_ara = False
            next_task_is_17_ara = False
            prev_task_is_21_ara = False
            next_task_is_21_ara = False
            enable_task_21_ara = False
            if station_name == 'ARA':
                if next_task == 17:
                    next_task_is_17_ara = Task.objects.filter(
                        station=station, task_id=17).values().first()

                if prev_task == 17:
                    prev_task_is_17_ara = Task.objects.filter(
                        station=station, task_id=17).values().first()

                if next_task == 21:
                    next_task_is_21_ara = True

                if prev_task == 21:
                    prev_task_is_21_ara = True

                task_21 = Task.objects.get(station=station, task_id=21)
                if CycleDate.objects.filter(task=task_21, cycle=date).exists():
                    enable_task_21_ara = True

            prev_task_is_3_mka = False
            next_task_is_3_mka = False
            enable_task_3_mka = False
            prev_task_is_10_mka = False
            next_task_is_10_mka = False
            prev_task_is_11_mka = False
            next_task_is_11_mka = False
            prev_task_is_14_mka = False
            next_task_is_14_mka = False
            enable_task_14_mka = False
            if station_name == 'MKA':
                if next_task == 3:
                    next_task_is_3_mka = True

                if prev_task == 3:
                    prev_task_is_3_mka = True

                task_3 = Task.objects.get(station=station, task_id=3)
                if CycleDate.objects.filter(task=task_3, cycle=date).exists():
                    enable_task_3_mka = True

                task_10 = Task.objects.get(station=station, task_id=10)
                is_alternate_day = alternate_day(
                    task_10.alternate_day_start, datetime.datetime.date(date_object))
                if next_task == 10:
                    next_task_is_10_mka = True
                    task_11 = Task.objects.filter(
                        station=station, task_id=11).first()
                    if day_num == int(task_11.weekday) and alternate_weekday(
                            datetime.datetime.date(date_object), int(task_11.weekday)):
                        weekday = True

                if prev_task == 10:
                    prev_task_is_10_mka = True

                if next_task == 11:
                    next_task_is_11_mka = Task.objects.filter(
                        station=station, task_id=11).values().first()

                if prev_task == 11:
                    prev_task_is_11_mka = Task.objects.filter(
                        station=station, task_id=11).values().first()

                if next_task == 14:
                    next_task_is_14_mka = True

                if prev_task == 14:
                    prev_task_is_14_mka = True

                task_14 = Task.objects.get(station=station, task_id=14)
                if CycleDate.objects.filter(task=task_14, cycle=date).exists():
                    enable_task_14_mka = True

            prev_task_is_10_bxr = False
            next_task_is_10_bxr = False
            prev_task_is_11_bxr = False
            next_task_is_11_bxr = False
            prev_task_is_19_bxr = False
            next_task_is_19_bxr = False
            enable_task_19_bxr = False
            if station_name == 'BXR':
                if next_task == 10:
                    next_task_is_10_bxr = Task.objects.filter(
                        station=station, task_id=10).first()
                    if Task.objects.filter(station=station, task_id=11).first().get_weekday_display() == day:
                        weekday = True

                if prev_task == 10:
                    prev_task_is_10_bxr = Task.objects.filter(
                        station=station, task_id=10).values().first()

                if next_task == 11:
                    next_task_is_11_bxr = Task.objects.filter(
                        station=station, task_id=11).values().first()

                if prev_task == 11:
                    prev_task_is_11_bxr = Task.objects.filter(
                        station=station, task_id=11).values().first()
                    if Task.objects.filter(station=station, task_id=10).first().get_weekday_display() == day:
                        weekday = True

                if next_task == 19:
                    next_task_is_19_bxr = True

                if prev_task == 19:
                    prev_task_is_19_bxr = True

                task_19 = Task.objects.get(station=station, task_id=19)
                if CycleDate.objects.filter(task=task_19, cycle=date).exists():
                    enable_task_19_bxr = True

            ##########################################  For side btns  ##########################################

            rating = Rating.objects.filter(
                task_shift_occur_id=occurrence_obj,
                date=date,
                task_shift_occur_id__task__station__station_name=station_name).last()
            comments = Comment.objects.filter(
                task_shift_occur_id=occurrence_obj,
                date=date,
                task_shift_occur_id__task__station__station_name=station_name).all().values_list()
            media = Media.objects.filter(
                task_shift_occur_id=occurrence_obj,
                date=date,
                task_shift_occur_id__task__station__station_name=station_name).all().values_list()

            role = user.user_type
            sup = role.name
            if rating is None:
                user1 = user
                task_status1 = 'pending'
            else:
                user1 = rating.user
                task_status1 = rating.task_status
                rating = GetRatingsSerializer(rating).data
            mobile_device = 1
            try:
                if (request.COOKIES['device'] == 'larger'):
                    mobile_device = 0
            except:
                pass
            if user1:
                user_json = serializers.serialize('json', [user1])

            context = {'rating': rating, 'task': task_dict, 'shift': shift_dict, 'occurrence_obj': occurrence_obj_dict, 'date': date, 'sup': sup, 'comments': comments, 'media': media, 'user': user_json, 'user1': user_json, 'task_status1': task_status1, 'usertype': sup, 'mobile_device': mobile_device, 'next_occur_task': next_occur_task, 'next_occur_shift': next_occur_shift, 'next_occurrence': next_occurrence,  'next_shift_task': next_shift_task, 'next_shift': next_shift, 'next_shift_occur': next_shift_occur, 'next_task': next_task, 'next_task_shift': next_task_shift, 'next_task_occur': next_task_occur, 'prev_task': prev_task, 'prev_task_shift': prev_task_shift, 'prev_task_occur': prev_task_occur, 'prev_shift_task': prev_shift_task, 'prev_shift': prev_shift, 'prev_shift_occur': prev_shift_occur, 'prev_page': prev_page, 'next_task_is_19': next_task_is_19, 'prev_task_is_19': prev_task_is_19, 'next_task_is_23': next_task_is_23, 'prev_task_is_23': prev_task_is_23,  'next_task_is_15': next_task_is_15, 'prev_task_is_15': prev_task_is_15, 'next_task_is_16': next_task_is_16, 'prev_task_is_16': prev_task_is_16, 'enable_task_16': enable_task_16, 'next_task_is_18': next_task_is_18, 'prev_task_is_18': prev_task_is_18, 'enable_task_18': enable_task_18, 'next_task_is_25': next_task_is_25, 'prev_task_is_25': prev_task_is_25, 'enable_task_25': enable_task_25, 'next_task_is_11': next_task_is_11, 'prev_task_is_11': prev_task_is_11, 'biweekly': biweekly, 'next_task_is_12': next_task_is_12, 'prev_task_is_12': prev_task_is_12, 'next_task_is_14': next_task_is_14, 'prev_task_is_14': prev_task_is_14, 'next_task_is_21': next_task_is_21, 'prev_task_is_21': prev_task_is_21, 'enable_task_14': enable_task_14, 'enable_task_21': enable_task_21, 'next_task_is_9_pnc': next_task_is_9_pnc, 'prev_task_is_9_pnc': prev_task_is_9_pnc, 'next_task_is_19_pnc': next_task_is_19_pnc, 'prev_task_is_19_pnc': prev_task_is_19_pnc, 'enable_task_19_pnc': enable_task_19_pnc, 'next_task_is_4_kiul': next_task_is_4_kiul, 'prev_task_is_4_kiul': prev_task_is_4_kiul,
                       'enable_task_4_kiul': enable_task_4_kiul, 'next_task_is_11_kiul': next_task_is_11_kiul, 'prev_task_is_11_kiul': prev_task_is_11_kiul, 'next_task_is_13_kiul': next_task_is_13_kiul, 'prev_task_is_13_kiul': prev_task_is_13_kiul, 'next_task_is_17_kiul': next_task_is_17_kiul, 'is_alternate_day': is_alternate_day, 'day': day, 'weekday': weekday, 'prev_task_is_17_ara': prev_task_is_17_ara, 'next_task_is_17_ara': next_task_is_17_ara, 'prev_task_is_21_ara': prev_task_is_21_ara, 'next_task_is_21_ara': next_task_is_21_ara, 'enable_task_21_ara': enable_task_21_ara, 'prev_task_is_10_bkp': prev_task_is_10_bkp, 'next_task_is_10_bkp': next_task_is_10_bkp, 'prev_task_is_19_bkp': prev_task_is_19_bkp, 'next_task_is_19_bkp': next_task_is_19_bkp, 'enable_task_19_bkp': enable_task_19_bkp, 'prev_task_is_21_bkp': prev_task_is_21_bkp, 'next_task_is_21_bkp': next_task_is_21_bkp, 'enable_task_21_bkp': enable_task_21_bkp, 'prev_task_is_10_bxr': prev_task_is_10_bxr, 'next_task_is_10_bxr': next_task_is_10_bxr, 'prev_task_is_11_bxr': prev_task_is_11_bxr, 'next_task_is_11_bxr': next_task_is_11_bxr, 'prev_task_is_19_bxr': prev_task_is_19_bxr, 'next_task_is_19_bxr': next_task_is_19_bxr, 'enable_task_19_bxr': enable_task_19_bxr, 'prev_task_is_10_jmu': prev_task_is_10_jmu, 'next_task_is_10_jmu': next_task_is_10_jmu, 'prev_task_is_11_jmu': prev_task_is_11_jmu, 'next_task_is_11_jmu': next_task_is_11_jmu, 'prev_task_is_19_jmu': prev_task_is_19_jmu, 'next_task_is_19_jmu': next_task_is_19_jmu, 'enable_task_19_jmu': enable_task_19_jmu, 'prev_task_is_24_jmu': prev_task_is_24_jmu, 'next_task_is_24_jmu': next_task_is_24_jmu, 'prev_task_is_3_mka': prev_task_is_3_mka, 'next_task_is_3_mka': next_task_is_3_mka, 'enable_task_3_mka': enable_task_3_mka, 'prev_task_is_10_mka': prev_task_is_10_mka, 'next_task_is_10_mka': next_task_is_10_mka, 'prev_task_is_11_mka': prev_task_is_11_mka, 'next_task_is_11_mka': next_task_is_11_mka, 'prev_task_is_14_mka': prev_task_is_14_mka, 'next_task_is_14_mka': next_task_is_14_mka, 'enable_task_14_mka': enable_task_14_mka}

            return Response(context, status=status.HTTP_200_OK)

        else:
            return Response({"error": "You don't have premission to view this page"}, status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        logging.exception(f"An error occurred in add_rating: {repr(e)}")
        return Response({"message": "An error occurred in Add Rating page"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
