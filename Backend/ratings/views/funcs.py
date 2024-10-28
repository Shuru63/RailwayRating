import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
import datetime
from dateutil.relativedelta import relativedelta

from shift.models import Shift
from station.models import Station
from task_shift_occurrence.models import TaskShiftOccurrence
from website.decorators import allowed_users
from website.utils import update_rating_status, add_cycle, delete_cycle
from task.models import Task


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@allowed_users(['railway admin', 'officer', 'supervisor', 'chi_sm'])
@ratelimit(key='ip', rate='50/m', block=True)
def enable_task(request):
    try:
        station = request.user.station
        date = request.data.get('date')
        action = request.data.get('action')
        task_id = request.data.get('task_id')
        try:
            task = Task.objects.get(station=station, task_id=task_id)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        cycle_type = task.cleaning_cycle_type
        cycle_type_name = task.get_cleaning_cycle_type_display()  # type: ignore

        if action == 'D':
            if delete_cycle(request.user.username, station, date, task):
                if task_cycle := task.cycles.order_by('cycle').last(): # type: ignore
                    if str(task_cycle.next_cycle) == date:
                        date_object = datetime.datetime.strptime(date, "%Y-%m-%d").date()
                        if cycle_type in ['B', 'H']:
                            next_cycle = date_object + relativedelta(months=+6)
                        elif cycle_type == 'Q':
                            next_cycle = date_object + relativedelta(months=+3)
                        elif cycle_type == 'M':
                            next_cycle = date_object + relativedelta(months=+1)
                        elif cycle_type == 'Y':
                            next_cycle = date_object + relativedelta(months=+12)
                        elif cycle_type == 'A':
                            next_cycle = date_object + relativedelta(days=+2)

                        task_cycle.next_cycle = next_cycle
                        task_cycle.save()
                context = {
                    'message': f"Successfully Disabled {cycle_type_name} Task: [{task_id}. {task.task_description[:25]}]",
                }
            else:
                context = {
                    'message': f"Sorry, Couldn't perform the action for Task: [{task_id}. {task.task_description[:25]}]",
                }
            return Response(context, status=status.HTTP_200_OK)

        if cycle_type in ['W', 'F']:
            weekday = request.data.get('day')
            task.weekday = weekday
            task.save()
            context = {
                'message': f"Weekday changed to {task.get_weekday_display()} for {cycle_type_name} Task: [{task_id}. {task.task_description[:25]}]",
            }
            return Response(context, status=status.HTTP_200_OK)

        if cycle_type == 'BW':
            weekday = request.data.get('day')
            bwday = request.data.get('bwday')
            if bwday == '1':
                task.weekday = weekday
            elif bwday == '2':
                task.biweekday = weekday

            task.save()
            context = {
                'message': f"Weekdays Updated, Weekday - 1: {task.get_weekday_display()} | Weekday - 2: {task.get_biweekday_display()} for {cycle_type_name} Task: [{task_id}. {task.task_description[:25]}]",
            }

            return Response(context, status=status.HTTP_200_OK)

        if action == 'E':
            if cycle_type == 'A':
                task.alternate_day_start = date
                task.save()

            if add_cycle(request.user.username, station, date, task):
                context = {
                    'message': f"Successfully Enabled {cycle_type_name} Task: [{task_id}. {task.task_description[:25]}]",
                }
                return Response(context, status=status.HTTP_200_OK)
            else:
                context = {
                    'message': f"Sorry, Couldn't perform the action for Task: [{task_id}. {task.task_description[:25]}]",
                }
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logging.exception(f"An error occurred in enable_task: {repr(e)}")
        return Response({"message": "An error occurred while enabling tasks"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def prev_page_url(request):
    '''
    For Automation purpose
    '''
    try:
        return Response({'status': 'success'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'error'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def task_description(request):
    date = request.data.get('date')
    task = request.data.get('task')
    shift = request.data.get('shift')
    occurrence = request.data.get('occurrence')
    station = request.data.get('station')
    try:   
        if station.isdigit():
            station = Station.objects.get(station_id=int(station))
        else:
            station = Station.objects.get(station_name=station)
    except Station.DoesNotExist:
        return Response({"error": "Station does not exist"}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        task = Task.objects.get(task_id=task, station=station)
        shift = Shift.objects.get(shift_id=shift, station=station)
        can_enter_rating_for_current_task = False
        task_description = task.task_description
        number_of_tasks = len(Task.objects.filter(station=station))
        task_shift_instances = TaskShiftOccurrence.objects.filter(
            task=task, shift=shift).all()
        number_of_occurences = len(task_shift_instances)

        task_shift_instance = task_shift_instances.filter(occurrence_id=int(occurrence)).first()
        if task_shift_instance:
            can_enter_rating_for_current_task = task_shift_instance.rating_required

        return Response({'taskDescription': task_description, 'number_of_occurences': number_of_occurences, 'number_of_tasks': number_of_tasks, 'can_enter_rating_for_current_task': can_enter_rating_for_current_task}, status=status.HTTP_200_OK)
    
    except ObjectDoesNotExist as e:
        logging.exception(f"Object not found: {repr(e)}")
        return Response({"message": e.args[0]}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        error = 'Error occurred in task_description'
        logging.exception(f"{error}: {repr(e)}")
        return Response({"message": error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
