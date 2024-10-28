import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes,api_view   
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework.exceptions import ValidationError
import datetime

from ..models import Rating
from ..serializers import RatingSerializer, UpdateRatingSerializer, TaskStatusUpdateSerializer, GetRatingsSerializer
from task_shift_occurrence.models import TaskShiftOccurrence
from task.models import Task
from shift.models import Shift
from website.utils import check_permission
from file_upload.models import Media

@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class CreateRatingAPIView(APIView):
    def post(self, request, task_id=None, shift_id=None, occurrence_id=None):
        try:
            user = request.user
            station = user.station
            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
                task = Task.objects.get(task_id=task_id, station=station)
                task_shift_occur_id = TaskShiftOccurrence.objects.get(
                    shift=shift, task=task, occurrence_id=occurrence_id)
                
            except (Shift.DoesNotExist, Task.DoesNotExist, TaskShiftOccurrence.DoesNotExist) as e:
                return Response({"message": e.args[0]}, status=status.HTTP_404_NOT_FOUND)
            
            data = request.data.copy()
            data['task_shift_occur_id'] = task_shift_occur_id.id
            data['user'] = request.user.id
            check = check_permission(user)
            role = user.user_type
            sup = role.name 

            if check and sup in ["supervisor", 'officer', 'railway admin', 'chi_sm']:
                serializer = RatingSerializer(data=data)
            else:
                return Response({"message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            if not serializer.is_valid(raise_exception=True):
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save(created_by=user.username, updated_by=user.username)
            full_serializer = GetRatingsSerializer(serializer.instance)
            response_data = [{"message": "Rating is uploaded"}, {'data': full_serializer.data}]
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        except ValidationError as e:
            return Response({"message": e.args[0]}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logging.exception(f"An error occurred in CreateRatingAPIView: {repr(e)}")
            message = "An error occurred while adding rating"
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def get(self, request, task_id=None, shift_id=None, occurrence_id=None):
        try:
            user = request.user
            station = user.station
            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
                task = Task.objects.get(task_id=task_id, station=station)
                task_shift_occur_id = TaskShiftOccurrence.objects.get(
                    shift=shift, task=task, occurrence_id=occurrence_id)
                
            except (Shift.DoesNotExist, Task.DoesNotExist, TaskShiftOccurrence.DoesNotExist) as e:
                return Response({"message": e.args[0]}, status=status.HTTP_404_NOT_FOUND)

            date = request.GET['date']
            rating = Rating.objects.filter(task_shift_occur_id=task_shift_occur_id, date=date).last()            
            serializer = GetRatingsSerializer(rating)
            return Response(serializer.data if rating else [], status=status.HTTP_200_OK)
        
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            message = 'An error occurred while fetching the rating'
            logging.exception(f"{message} in CreateRatingAPIView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class UpdateRatingAPIView(APIView):
    def put(self, request, rating_id):
        try:
            try:
                rating = Rating.objects.get(id=rating_id)
            except Rating.DoesNotExist:
                return Response({"error": "Rating does not exist"}, status=status.HTTP_404_NOT_FOUND)
            
            data = request.data
            user = request.user
            check = check_permission(user)
            sup = user.user_type.name
            if check and sup in ["supervisor", 'officer', 'railway admin', 'chi_sm']:
                serializer = UpdateRatingSerializer(rating, data)
            else:
                return Response({"message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            if not serializer.is_valid(raise_exception=True):
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            serializer.save(updated_by=user.username)
            full_serializer = GetRatingsSerializer(serializer.instance)
            response_data = [{"message": "Rating is updated"}, {'data': full_serializer.data}]
            return Response(response_data, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({"message": e.args[0]}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            message = 'An error occurred while updating the rating'
            logging.exception(f"{message} in UpdateRatingAPIView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class TaskStatusUpdateAPIView(APIView):
    def put(self, request, task_id=None, shift_id=None, occurrence_id=None, format=None):
        try:
            user = request.user
            station = user.station
            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
                task = Task.objects.get(task_id=task_id, station=station)
                task_shift_occur_id = TaskShiftOccurrence.objects.get(
                    shift=shift, task=task, occurrence_id=occurrence_id)
                
            except (Shift.DoesNotExist, Task.DoesNotExist, TaskShiftOccurrence.DoesNotExist) as e:
                return Response({"message": e.args[0]}, status=status.HTTP_404_NOT_FOUND)
            
            data = request.data
            date = data['date']
            check = check_permission(user)
            sup = user.user_type.name
            if check and sup in ['officer', 'railway admin']:
                rating = Rating.objects.filter(task_shift_occur_id=task_shift_occur_id, date=date, user__station=station).last()
                serializer = TaskStatusUpdateSerializer(rating, data=data)

            else:
                return Response({"message": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save(updated_by=user.username)
            full_serializer = GetRatingsSerializer(serializer.instance)
            response_data = [{"message": "Task Status is Updated"}, {'data': full_serializer.data}]
            return Response(response_data, status=status.HTTP_200_OK)
        
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            message = 'An error occurred while updating the task_status of the rating'
            logging.exception(f"{message} in TaskStatusUpdateAPIView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_occurrence_image_status(request):
    try:
        date = request.GET['date']
        station_id = request.GET['station_id']
        task_num = request.GET['task_num']
        shift_num = request.GET['shift_num']
        occurrence = request.GET['occurrence']

        task_shift_occurrence = TaskShiftOccurrence.objects.get(
            task__station__station_id=station_id,
            task__task_id=task_num,
            shift__shift_id=shift_num,
            occurrence_id=occurrence
        )

        has_images = Media.objects.filter(
            task_shift_occur_id=task_shift_occurrence,
            date=date
        ).exists()
        
        response_data = {'has_images': has_images}
        logging.info(f"Image status request for TaskShiftOccurrence {task_shift_occurrence.id}.")
        return Response(response_data, status=status.HTTP_200_OK)

    except KeyError as e:
        return Response({'message': f'Data missing: {e.args[0]}'}, status=status.HTTP_400_BAD_REQUEST)

    except TaskShiftOccurrence.DoesNotExist:
        return Response({'message': 'TaskShiftOccurrence does not exist'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logging.exception(f"An Error Occurred in TaskStatusUpdateAPIView: {repr(e)}")
        return Response({'message': 'An error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
