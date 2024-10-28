import logging
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .serializers import CommentSerializer
from .models import Comment
from shift.models import Shift
from task.models import Task
from task_shift_occurrence.models import TaskShiftOccurrence
from website.utils import check_permission


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class CommentAPI(APIView):
    def post(self, request, date=None, task_id=None, shift_id=None, occurrence_id=None, format=None):
        try:
            user = request.user
            station = user.station
            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
                task = Task.objects.get(task_id=task_id, station=station)
                task_shift_occur = TaskShiftOccurrence.objects.get(
                    shift=shift, task=task, occurrence_id=occurrence_id)
                
            except (Shift.DoesNotExist, Task.DoesNotExist, TaskShiftOccurrence.DoesNotExist) as e:
                logging.exception(f"Object not found: {repr(e)}")
                return Response({"message": "Object not found"}, status=status.HTTP_404_NOT_FOUND)

            data = request.data.copy()
            if data.get('text'):
                check = check_permission(user)
                role = user.user_type
                sup = role.name
                if check and sup in ["supervisor", "railway admin", "officer"]:
                    data['task_shift_occur_id'] = task_shift_occur.id
                    data['date'] = date
                    serializer = CommentSerializer(data=data, partial=True)
                    if serializer.is_valid():
                        serializer.save(user=user, created_by=user.username, updated_by=user.username)
                        # print(serializer.data)
                        return Response({'message': 'Comment is added'}, status=status.HTTP_201_CREATED)
                    else:
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({'message': 'Please enter something'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            message = 'Error occurred while creating comment'
            logging.exception(f"{message} in CommentAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def get(self, request, date=None, task_id=None, shift_id=None, occurrence_id=None, format=None):
        try:
            user = request.user
            station = user.station
            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
                task = Task.objects.get(task_id=task_id, station=station)
                task_shift_occur = TaskShiftOccurrence.objects.get(
                    shift=shift, task=task, occurrence_id=occurrence_id)
                
            except (Shift.DoesNotExist, Task.DoesNotExist, TaskShiftOccurrence.DoesNotExist) as e:
                logging.exception(f"Object not found: {repr(e)}")
                return Response({"message": "Object not found"}, status=status.HTTP_404_NOT_FOUND)

            comments = Comment.objects.filter(task_shift_occur_id=task_shift_occur, date=date)
            if not comments:
                return Response({'message': 'No comments found for the specified task, shift, and occurrence.'}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            message = 'An error occurred while retrieving comments'
            logging.exception(f"{message} in CommentAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def put(self, request, comment_id=None, format=None):
        try:
            data = request.data
            try:
                comment = Comment.objects.get(id=comment_id)
            except Comment.DoesNotExist:
                return Response({"message": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

            user = request.user
            check = check_permission(user)
            role = user.user_type
            sup = role.name

            if check and sup in ["supervisor", "railway admin", "officer"]:
                serializer = CommentSerializer(comment, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save(updated_by=user.username)
                    return Response({'message': 'Comment updated'}, status=status.HTTP_200_OK)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)
        
        except Exception as e:
            message = 'An error occurred while updating the comment'
            logging.exception(f"{message} in CommentAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

    def delete(self, request, comment_id=None, format=None):
        try:
            try:
                comment = Comment.objects.get(id=comment_id)
            except Comment.DoesNotExist:
                return Response({"message": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

            user = request.user
            check = check_permission(user)
            role = user.user_type
            sup = role.name
            if check and sup in ["supervisor", "railway admin", "officer"]:
                comment.delete()
                return Response({'message': 'Comment deleted'}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'Permission Denied'}, status=status.HTTP_403_FORBIDDEN)

        except Exception as e:
            message = 'An error occurred while deleting the comment'
            logging.exception(f"{message} in CommentAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
