from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ParseError
from django.core.mail import send_mail, BadHeaderError
from django.template.loader import render_to_string
from smtplib import SMTPSenderRefused, SMTPRecipientsRefused
from django_ratelimit.decorators import ratelimit
import datetime
from datetime import timedelta
from django.utils import timezone
import random
import logging

from shift.models import Shift, Verified_shift
from user_onboarding.models import OTP
from feedback.models import FeedbackSummaryVerification
from pdf.models import DailyEvaluationVerification
from cms.settings import EMAIL_SENDER, DOMAIN


logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def verify_signature_email(request):
    try:
        email = request.user.email
        subject = "Verify Your Email"
        email_template_name = "email/email_otp.txt"
        otp = random.randint(100000, 999999)
        OTP.objects.create(email=email, otp=otp)
        c = {
            "email": email,
            'otp': otp,
            'domain': DOMAIN,
            'site_name': 'Website',
            'protocol': 'https',
        }
        message = render_to_string(email_template_name, c)
        try:
            send_mail(
                subject, message, EMAIL_SENDER, [email], fail_silently=False)
            logger.info(f"Email sent to : {email}")
            return Response({'message': 'Email sent successfully, Please check your Email'}, status=status.HTTP_201_CREATED)

        except (BadHeaderError, SMTPSenderRefused, SMTPRecipientsRefused) as e:
            logger.error(f"Email not sent with exception : {repr(e)}")
            return Response({"message": "An error occurred while sending the email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Email not sent with exception : {repr(e)}")
            return Response({"message": "SMTPRecipientsRefused"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        message = 'An error occurred while verifying the email'
        logging.exception(f"{message} in verify_signature_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def confirm_signature_email(request):
    try:
        data = request.data
        email = request.user.email

        try:
            user_otp = data['otp']
            curr_shift = data["currShift"]
            date = data["date"]
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(
            email=email).order_by('-timestamp').first()

        if len(user_otp) != 6:
            return Response({'message': 'OTP length should be 6'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj and otp_obj.otp:
            expiry_time = otp_obj.timestamp + timedelta(minutes=10)

            if timezone.now() > expiry_time or otp_obj.counter >= 3:
                otp_obj.delete()
                return Response({"message": "OTP has expired. Please generate a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

            elif otp_obj.otp == user_otp:
                otp_obj.delete()
                verified_by = request.user
                shift_object = Shift.objects.filter(
                    shift_id=curr_shift, station=verified_by.station).first()
                
                if not shift_object:
                    return Response({'message': 'Shift not found'}, status=status.HTTP_404_NOT_FOUND)

                verified_shift = Verified_shift(
                    shift=shift_object,
                    verified_shift_date=date,
                    verified_by=verified_by,
                    verified_email=email,
                    verified_at=datetime.datetime.now()
                )

                verified_shift.save()
                return Response({'message': 'OTP Verified'}, status=status.HTTP_200_OK)

            else:
                otp_obj.counter += 1
                otp_obj.save()
                return Response({'message': 'Incorrect OTP'}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        message = 'An error occurred while verifying the email'
        logger.exception(f"{message} in confirm_signature_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def confirm_signature_email_feedback_summary(request):
    try:
        data = request.data
        email = request.user.email

        try:
            user_otp = data['otp']
            date = data["date"]
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(
            email=email).order_by('-timestamp').first()

        if len(user_otp) != 6:
            return Response({'message': 'OTP length should be 6'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj and otp_obj.otp:
            expiry_time = otp_obj.timestamp + timedelta(minutes=10)

            if timezone.now() > expiry_time or otp_obj.counter >= 3:
                otp_obj.delete()
                return Response({"message": "OTP has expired. Please generate a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

            elif otp_obj.otp == user_otp:
                otp_obj.delete()
                verified_by = request.user
                station = request.user.station

                summary_object = FeedbackSummaryVerification(
                    verified_summary_date=date,
                    verified_by=verified_by,
                    station=station,
                    email=email,
                    verified_at=datetime.datetime.now(),
                    verification_status=True
                )

                summary_object.save()

                return Response({'message': 'OTP Verified'}, status=status.HTTP_200_OK)
            else:
                otp_obj.counter += 1
                otp_obj.save()
                return Response({'message': 'Incorrect OTP'}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        message = 'An error occurred while verifying the email'
        logger.exception(f"{message} in confirm_signature_email_feedback_summary: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def confirm_signature_email_daily_eval(request):
    try:
        data = request.data
        email = request.user.email

        try:
            user_otp = data['otp']
            date = data["date"]
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(
            email=email).order_by('-timestamp').first()

        if len(user_otp) != 6:
            return Response({'message': 'OTP length should be 6'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj and otp_obj.otp:
            expiry_time = otp_obj.timestamp + timedelta(minutes=10)

            if timezone.now() > expiry_time or otp_obj.counter >= 3:
                otp_obj.delete()
                return Response({"message": "OTP has expired. Please generate a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

            elif otp_obj.otp == user_otp:
                otp_obj.delete()
                verified_by = request.user
                station = request.user.station

                evaluation_object = DailyEvaluationVerification(
                    verified_eval_date=date,
                    verified_by=verified_by,
                    station=station,
                    email=email,
                    verified_at=datetime.datetime.now(),
                    verification_status=True
                )

                evaluation_object.save()

                return Response({'message': 'OTP Verified'}, status=status.HTTP_200_OK)
            else:
                otp_obj.counter += 1
                otp_obj.save()
                return Response({'message': 'Incorrect OTP'}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        message = 'An error occurred while verifying the email'
        logger.exception(f"{message} in confirm_signature_email_daily_eval: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
