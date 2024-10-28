from datetime import datetime as dt, timedelta
import logging
from datetime import datetime as dte
from rest_framework.response import Response
from rest_framework import status
import datetime
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.validators import validate_email
from rest_framework.views import APIView
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError as DRFValidationError
from datetime import timedelta, datetime as dt, date as dte
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.core import serializers
from rest_framework.generics import (
    UpdateAPIView, 
    RetrieveUpdateAPIView,
    ListAPIView,
    )
from django.utils import timezone

from .models import Feedback
from .serializers import (
    FeedbackSerializer, 
    FeedbackUpdateSerializer, 
    FeedbackStatusUpdateSerializer
    )
from website.utils import check_permission
from website.decorators import allowed_users
from user_onboarding.models import OTP
from user_onboarding.otp_auth import send_email_otp, check_email_otp
from website.permissions import IsRailwayAdmin
from feedback.models import FeedbackSummaryVerification


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['supervisor', 'contractor', 'railway admin', 'officer', 'chi_sm'])
def passenger_feedback(request):
    try: 
        station = request.user.station
        station_json = serializers.serialize('json', [station])
        user = request.user
        role = user.user_type
        sup = role.name

        if check_permission(user):
            current_time = datetime.datetime.now().time()
            if current_time >= datetime.time(22, 0, 0):
                current_date = (datetime.datetime.now() + timedelta(days=1)).date()
            else:
                current_date = datetime.datetime.now().date()
            date = current_date.strftime('%d-%m-%Y')

            context = {
                'sup': sup, 
                'date': date, 
                'station': station_json
            }

            return Response(context, status=status.HTTP_200_OK)
        else:
            messages = f"{sup} don't have permission to do this task"
            return Response({'message': messages}, status=status.HTTP_403_FORBIDDEN)
        
    except Exception as e:
        logging.exception(f"An error occured in passenger_feedback: {repr(e)}")
        return Response(
            {"message": "An error occurred while loading passenger feedback"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def verify_passenger_email(request):
    try:
        email = request.data['email'].strip()
        
        return send_email_otp(
                email=email, 
                subject='Verify Your Email', 
                email_template_name='email/email_otp.txt',
                otp_data=None
                )
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"})

    except Exception as e:
        message = 'An error occurred while sending OTP to the passenger email'
        logging.exception(f"{message} in verify_passenger_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def confirm_passenger_email(request):
    try:
        data = request.data

        try:
            email = data['email'].strip()
            user_otp = data['otp'].strip()
            date = data["date"]
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_email(email)
        except ValidationError:
            return Response({"message": "Invalid Email"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(email=email).order_by('-timestamp').first()
        if otp_obj and otp_obj.otp:
            result = check_email_otp(otp_obj, user_otp)
            if isinstance(result, Response):
                return result
            else:
                # verified_by = request.user
                # station = request.user.station

                # summary_object = FeedbackSummaryVerification(
                #     verified_summary_date=date,
                #     verified_by=verified_by,
                #     station=station,
                #     email=email,
                #     verified_at=datetime.datetime.now(),
                #     verification_status=True
                # )
                # summary_object.save()
                return Response({'message': 'OTP Verified'}, status=status.HTTP_200_OK)

        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        message = 'An error occurred while verifying the passenger email'
        logging.exception(f"{message} in confirm_passenger_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class FeedbackAPI(APIView):
    def post(self, request, format=None, station_code=None):
        try:
            data = request.data.copy()
            user = request.user
            station = user.station
            role = user.user_type
            sup = role.name
            
            if check_permission(user) and sup in ["supervisor", "contractor", "railway admin", 'officer', 'chi_sm']:
                verified_string = data['verification_status']
                verified = verified_string == "yes"
                try:
                    data['verified'] = verified
                    data['time'] = timezone.now().time()
                    serializer = FeedbackSerializer(data=data, partial=True)
                    if serializer.is_valid(raise_exception=True):
                        if not any(data.get(f"feedback_value_{i}") for i in range(1, 6)):
                            return Response({"message": "At least one feedback field is required."}, status=status.HTTP_400_BAD_REQUEST)
                        serializer.save(created_by=user.username, updated_by=user.username, user=user, station=station)
                        response_data = {'message': 'Feedback is uploaded', 'data': serializer.data}
                        return Response(response_data, status=status.HTTP_201_CREATED)
                    else:
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
                except DRFValidationError as e:
                    error_messages = '; '.join(f'{field}: {errors[0]}' for field, errors in e.detail.items())
                    return Response({"message": error_messages}, status=status.HTTP_400_BAD_REQUEST)
                
                except KeyError as e:
                    return Response({"message": f"Missing data: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"message": "Permission Denied"}, status=status.HTTP_403_FORBIDDEN)

        except Exception as e:
            message = "An error occurred while uploading the feedback"
            logging.exception(f"{message} in FeedbackAPI: {repr(e)}")
            return Response(message, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def get(self, request, station_code= None, date=None, format=None):
        feedback_data = Feedback.objects.filter(
            date=date, station__station_code=station_code).order_by('id')
        return list(feedback_data)
    

    def get_monthly(self, request, format=None, date=None):
        month_date = dt.strptime(str(date), '%Y-%m-%d')
        month = month_date.month
        year = month_date.year
        first_day = dte(year, month, 1)
        last_day = dte(year, month + 1, 1) - timedelta(days=1)
        station = request.user.station
        feedback_data = Feedback.objects.filter(date__range=(
            first_day, last_day), station=station).order_by('id')
        return list(feedback_data)
    

    def get_weekly(self, request, format=None, date=None, start_day=None, end_day=None):
        month_date = dt.strptime(str(date), '%Y-%m-%d')
        month = month_date.month
        year = month_date.year
        first_day = dte(year, month, start_day)
        last_day = dte(year, month, end_day)
        station = request.user.station
        feedback_data = Feedback.objects.filter(date__range=(
            first_day, last_day), station=station).order_by('id')
        return list(feedback_data)
    

    def get_all(self, request, format=None):
        station = request.user.station
        feedback_data = Feedback.objects.filter(station=station).order_by('id')
        return list(feedback_data)


class FeedbackListAPI(ListAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        station = self.request.user.station
        return Feedback.objects.filter(
            station=station,
            date=self.kwargs['date']
            ).order_by('created_at')


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class FeedbackDetailUpdateAPI(RetrieveUpdateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return FeedbackSerializer
        return FeedbackUpdateSerializer
    
    def get_object(self):
        return get_object_or_404(Feedback, id=self.kwargs['feedback_id'])

    def patch(self, request, *args, **kwargs):
        feedback = self.get_object()
        data = request.data.copy()
        try:
            if feedback.user != request.user:
                return Response({"message": "You do not have permission to update this feedback"}, status=status.HTTP_403_FORBIDDEN)
            
            if feedback.status == 'C':
                return Response({"message": "Feedback is closed"}, status=status.HTTP_403_FORBIDDEN)
            
            verified_string = data['verification_status']
            verified = verified_string == "yes"
            user = request.user
            data['verified'] = verified

            serializer = self.get_serializer(feedback, data=data, partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save(updated_by=user.username)
                response_data = {'message': 'Feedback updated', 'data': serializer.data}
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except KeyError as e:
            return Response({"message": f"Missing data: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            message = 'An error occurred while updating the feedback'
            logging.exception(f"{message} in FeedbackDetailUpdateAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class UpdateFeedbackStatusAPI(UpdateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackStatusUpdateSerializer
    permission_classes = [IsAuthenticated, IsRailwayAdmin]
    lookup_field = 'id'

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user.username)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class DeleteFeedbackAPI(APIView):
    def delete(self, request, feedback_id=None, format=None):
        try:
            feedback = get_object_or_404(Feedback, id=feedback_id)
            if feedback.user != request.user:
                return Response({"message": "You do not have permission to delete this feedback"}, status=status.HTTP_403_FORBIDDEN)
            
            feedback.delete()
            return Response({"message": "Feedback deleted"}, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            return Response({"message": "Feedback not found"}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            message = 'An error occurrred while deleting the feedback'
            logging.exception(f"{message} in DeleteFeedbackAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
