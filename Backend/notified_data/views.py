import logging
import os
from rest_framework.views import APIView
from django.template.loader import render_to_string
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.exceptions import PermissionDenied
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import datetime, timedelta

from .models import notified_data
from .utils import send_email, send_sms_message_twilio, upload_notified_feedback_image
from notified_users.models import notified_users
from notified_task.models import notified_task
from website.decorators import allowed_users
from website.utils import check_permission
from .serializers import ComplaintSerializer, ComplaintUpdateSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['railway manager', 'railway admin', 'officer', 'chi_sm'])
def complain(request):
    try:
        user = request.user
        check = check_permission(user)
        role = user.user_type
        sup = role.name
        tasks = notified_task.objects.filter().all()

        if check:
            return Response({
                'message': 'Task retrieved successfully', 
                'tasks_count': len(tasks), 
                'tasks': tasks.values_list(), 
                "role": sup
                }, status=status.HTTP_200_OK)
        else:
            return Response({'error': f"{sup} don't have permission to do this task"}, status=status.HTTP_403_FORBIDDEN)
        
    except Exception as e:
        message = 'An error occurred while loading the complain page'
        logging.exception(f"{message} in complain: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class NotifiedFeedbackAPI(APIView):
    def post(self, request, notified_task_id=None):
        try:
            feedback = request.data['feedback']
            complaint_date = request.data['date']
            user = request.user
            station = user.station
            check = check_permission(user)
            role = user.user_type
            sup = role.name
            date = datetime.now()

            if sup not in ['railway manager', 'railway admin', 'chi_sm', 'officer']:
                return Response({'message': 'You are not allowed to give feedback'}, status=status.HTTP_403_FORBIDDEN)

            if check:
                try:
                    task = notified_task.objects.get(task_id=notified_task_id)

                except notified_task.DoesNotExist:
                    return Response({"message": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
                
                except notified_task.MultipleObjectsReturned:
                    logging.exception("Multiple tasks with task_id is found")
                    return Response({"message": "Error with the specified task"}, status=status.HTTP_400_BAD_REQUEST)
                
                now = timezone.now()
                time_threshold = now - timedelta(minutes=5)
                existing_complain = notified_data.objects.filter(
                    user=user, 
                    complaint_date=complaint_date,
                    task=task, 
                    feedback=feedback, 
                    latitude=request.data['latitude'],
                    longitude=request.data['longitude'],
                    created_by=user.username, 
                    updated_by=user.username,
                    created_at__gte=time_threshold
                )

                if existing_complain.exists():
                    message = {"message": "Same feedback has been submitted less than 5 minutes ago. Please submit a different feedback"}
                    return Response(message, status=status.HTTP_200_OK)
                
                feedback_complaint = notified_data.objects.create(
                    user=user, 
                    complaint_date=complaint_date,
                    task=task, 
                    feedback=feedback, 
                    latitude=request.data['latitude'],
                    longitude=request.data['longitude'],
                    date=date, 
                    created_by=user.username, 
                    updated_by=user.username
                )
                # uploading images for the particular feedback
                if request.FILES:
                    result = upload_notified_feedback_image(request, feedback_complaint)
                    if isinstance(result, Response):
                        return result
                return Response({'message': 'Feedback submitted successfully'}, status=status.HTTP_201_CREATED)
                
                # notified_users_objects = None
                # current_username = user.username
                # if current_username == 'mayank_man_6265187013' or os.getenv('ENV') == 'LOCAL':
                #     my_numbers = [6265187023, 8103071386]
                #     notified_users_objects = notified_users.objects.filter(
                #         mobile_number__in=my_numbers, assigned_station=station).all()

                # if os.getenv('ENV') == 'PROD':
                #     notified_users_objects = notified_users.objects.filter(
                #         assigned_tasks=task, assigned_station=station).all()

                # if notified_users_objects is None:
                #     return Response({'message': 'There are no users to send feedback'}, status=status.HTTP_404_NOT_FOUND)

                # sms_recipients = []
                # email_recipients = []

                # complain_template = "email/complain.txt"
                # by = station.station_name + ' Station Manager'
                # c = {
                #     'task': task,
                #     'user': user,
                #     'feedback': feedback,
                #     'by': by
                # }
                # body = render_to_string(complain_template, c)
                # fail_emails = []
                # success_emails = []
                # for notified_user in notified_users_objects:
                #     # for email
                #     try:
                #         subject = f'Complaint for: {task.task_description} by {station.station_name} Station Manager'
                #         email_recipients.append(notified_user.email)
                #         send_email(subject, body, notified_user.email)
                #         logging.info(f"Complaint email sent to: {notified_user.email}")
                #         success_emails.append(notified_user.email)
                #     except Exception as e:
                #         logging.exception(f"Complaint email didn't sent to: {notified_user.email}")
                #         fail_emails.append(notified_user.email)

                #     # for mobile
                #     try:
                #         sms_recipients.append(int(notified_user.mobile_number))
                #     except Exception as e:
                #         logging.exception(f"An error occurred in NotifiedFeedbackAPI: {repr(e)}")

                # email_status = {
                #     'success': success_emails, 
                #     'fail': fail_emails
                #     }
                # sms_status = send_sms_message_twilio(sms_recipients, body)

                # return Response({'message': f'{email_status} and {sms_status}'}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'You do not have permission to give feedback'}, status=status.HTTP_403_FORBIDDEN)
            
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            message = 'An error occurred while sending the complain message'
            logging.exception(f"{message} in NotifiedFeedbackAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ComplaintsListAPIView(ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = (IsAuthenticated, )


    def get_queryset(self):
        return notified_data.objects.select_related('task').filter(
            complaint_date=self.kwargs.get('date'), 
            user=self.request.user,
            user__station=self.request.user.station
        )


class ComplaintDetailUpdateDeleteAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated, )

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return ComplaintUpdateSerializer
        else:
            return ComplaintSerializer

    def get_object(self):
        return notified_data.objects.select_related('task').get(
            id=self.kwargs.get('complaint_id'),
        )
    
    def patch(self, request, *args, **kwargs):
        complaint = self.get_object()
        try:
            if complaint.user != request.user:
                raise PermissionDenied("You do not have permission to update this complaint")
            
            if request.FILES:
                result = upload_notified_feedback_image(request, complaint)
                if isinstance(result, Response):
                    return result

            serializer = self.get_serializer(complaint, data=request.data, partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save(updated_by=request.user.username)
                response_data = {'message': 'Complaint feedback updated successfully', 'data': serializer.data}
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            message = 'An error occurred while updating the complain feedback'
            logging.exception(f"{message} in ComplaintDetailUpdateDeleteAPIView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, *args, **kwargs):
        complaint = self.get_object()
        try:
            if complaint.user != request.user:
                raise PermissionDenied("You do not have permission to delete this complaint")

            complaint.delete()
            return Response({'message': 'Complaint feedback deleted successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            message = 'An error occurred while deleting the complain feedback'
            logging.exception(f"{message} in ComplaintDetailUpdateDeleteAPIView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

