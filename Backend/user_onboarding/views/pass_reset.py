from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail, BadHeaderError
from smtplib import SMTPSenderRefused
from django_ratelimit.decorators import ratelimit
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import logging

from ..models import User
from ..forms import PasswordResetConfirmForm
from cms.settings import DOMAIN, EMAIL_SENDER



@csrf_exempt
@api_view(['POST'])
@ratelimit(key='ip' , rate='10/m', block=True)
def password_reset_request(request):
    try:
        email = request.data['email'].strip()
        try:
            validate_email(email)
        except ValidationError as e:
            return Response({"message": "Invalid Email"}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.get(email=email)
        subject = "Password Reset Requested"
        email_template_name = "email/password_reset_email.txt"
        context = {
            "email": user.email,
            'domain': DOMAIN,
            'site_name': 'Website',
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "user": user,
            'token': default_token_generator.make_token(user),
            'protocol': 'https',
        }
        mail = render_to_string(email_template_name, context)

        try:
            send_mail(subject, mail, EMAIL_SENDER, [user.email], fail_silently=False)
            logging.info(f"Password reset email sent to {user.email}")
            return Response({'message': 'Password reset email sent successfully'}, status=status.HTTP_200_OK)
        
        except BadHeaderError as e:
            logging.exception(f"Email not sent to {user.email} with exception: {repr(e)}")
            return Response({'message': 'Invalid header found.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        except SMTPSenderRefused as e:
            logging.exception(f"Email not sent to {user.email} with exception: {repr(e)}")
            return Response({'message': 'SMTPSenderRefused'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logging.exception(f"An error occurred in password_reset_request view: {repr(e)}")
        return Response({'message': 'An error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', block=True)
def password_reset_confirm(request, uidb64=None, token=None):
    try:
        assert uidb64 is not None and token is not None  # checked by URLconf
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User._default_manager.get(pk=uid)

    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
        logging.exception(f"An error occurred while validating the user inpassword_reset_confirm: {repr(e)}")

    try:
        assert user and default_token_generator.check_token(user, token)
    except AssertionError:
        return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        form = PasswordResetConfirmForm(user, request.data)
        if form.is_valid():
            form.save()
            return Response({'message': 'Password reset complete'}, status=status.HTTP_200_OK)
        else:
            return Response({'errors': form.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        message = 'An error occurred while resetting the password'
        logging.exception(f'{message} in password_reset_confirm: {repr(e)}')
        return Response({'message': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
