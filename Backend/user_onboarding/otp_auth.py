import requests
import logging
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail, BadHeaderError
from django.template.loader import render_to_string
from smtplib import SMTPSenderRefused, SMTPRecipientsRefused
from datetime import timedelta
from django.utils import timezone
import random

from cms.settings import EMAIL_SENDER, DOMAIN, AUTH
from user_onboarding.models import OTP


API_KEY = AUTH["api_key"]

def send_otp_request(to, template_name):
    number = "+91"+to
    url = f"https://2factor.in/API/V1/{API_KEY}/SMS/{number}/AUTOGEN/{template_name}"

    try:
        response = requests.get(url)
    except requests.RequestException as e:
        logging.error(f"Exception: {str(e)}")
        return False
    
    data = response.json()

    if data["Status"] == "Success":
        session_id = data["Details"]
        return session_id
    else:
        return None


def verify_otp(session_id, otp_code):
    url = f"https://2factor.in/API/V1/{API_KEY}/SMS/VERIFY/{session_id}/{otp_code}"

    try:
        response = requests.get(url)
    except requests.RequestException as e:
        logging.error(f"Exception: {str(e)}")
        return False

    data = response.json()

    if data["Status"] == "Success":
        if data["Details"] == "OTP Matched":
            return True
        else:
            return False
    else:
        return False


def send_email_otp(email, subject, email_template_name, otp_data):
    try:
        try:
            validate_email(email)
        except ValidationError:
            return Response({"message": "Invalid Email"}, status=status.HTTP_400_BAD_REQUEST)

        otp = random.randint(100000, 999999)
        OTP.objects.create(email=email, otp=otp, data=otp_data)
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
            
            logging.info(f"Email sent to : {email}")
            return Response({'message': 'Email sent successfully, Please check your Email'}, status=status.HTTP_201_CREATED)

        except (BadHeaderError, SMTPSenderRefused, SMTPRecipientsRefused) as e:
            logging.exception(f"Email not sent with exception : {repr(e)}")
            return Response({"message": "An error occurred while sending the email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logging.exception(f"Email not sent with exception : {repr(e)}")
            return Response({"message": "SMTPRecipientsRefused"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        message = 'An error occurred while mailing the otp'
        logging.exception(f"{message} in send_email_otp: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def check_mobile_otp(otp_obj, user_otp):
    try:
        if len(user_otp) != 6:
            return Response({"message": "OTP length should be 6"}, status=status.HTTP_400_BAD_REQUEST)

        expiry_time = otp_obj.timestamp + timedelta(minutes=10)
        if timezone.now() > expiry_time or otp_obj.counter >= 3:
            otp_obj.delete()
            return Response({"message": "OTP has expired. Please generate a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = otp_obj.session_id
        if session_id:
            is_otp_correct = verify_otp(session_id, user_otp)
            if is_otp_correct:
                data = otp_obj.data
                otp_obj.delete()
                return (True, data)
            else:
                otp_obj.counter += 1
                otp_obj.save()
                return Response({'message': 'Incorrect OTP'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'message': 'Missing Session ID'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        message = 'An error occurred while verifying the mobile OTP'
        logging.exception(f"{message} in check_mobile_otp: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

def check_email_otp(otp_obj, user_otp):
    try:
        if len(user_otp) != 6:
            return Response({"message": "OTP length should be 6"}, status=status.HTTP_400_BAD_REQUEST)

        expiry_time = otp_obj.timestamp + timedelta(minutes=10)
        if timezone.now() > expiry_time or otp_obj.counter >= 3:
            otp_obj.delete()
            return Response({"message": "OTP has expired. Please generate a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
        
        elif otp_obj.otp == user_otp:
            data = otp_obj.data
            otp_obj.delete()
            return (True, data)
        else:
            otp_obj.counter += 1
            otp_obj.save()
            return Response({'message': 'Incorrect OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        message = 'An error occurred while verifying the email OTP'
        logging.exception(f"{message} in check_email_otp: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

