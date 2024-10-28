from django.template.loader import render_to_string
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.core import serializers
from django.core.exceptions import ObjectDoesNotExist
import logging
import re

from ..serializers import RequestUserSerializer, UserSerializer
from ..models import RequestUser, User, Roles, Post, Assign_Permission, OTP
from ..otp_auth import send_otp_request, send_email_otp, check_email_otp, check_mobile_otp
from station.models import Station
from website.decorators import allowed_users
from cms.settings import EMAIL_SENDER, DOMAIN


@method_decorator(ratelimit(key='ip', rate='10/m', block=True), name='dispatch')
class UserRequestUserView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            serializer = RequestUserSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                message = {"message": "You have successfully requested for User, Please wait for some time"}
                return Response(message, status=status.HTTP_201_CREATED)
            
            return Response({"message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        except DRFValidationError as e:
            return Response({"message": repr(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            message = 'An error occurred while requesting for user'
            logging.exception(f"{message} in UserRequestUserView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', block=True)
def verify_email(request):
    try:
        email = request.data['email'].strip()

        is_req_pending = RequestUser.objects.filter(user_email=email, seen=False).exists()
        if is_req_pending:
            return Response({"message": "Your Sign Up request is pending! Please wait for some time."}, status=status.HTTP_102_PROCESSING)

        email_exist = User.objects.filter(email=email).exists()
        if email_exist:
            return Response({'message': 'Email Already Exist!'}, status=status.HTTP_302_FOUND)

        if not email_exist and not is_req_pending:
            return send_email_otp(
                email=email, 
                subject='Verify Your Email', 
                email_template_name='email/email_otp.txt',
                otp_data=None
                )
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while mailing the OTP'
        logging.exception(f"{message} in verify_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', block=True)
def confirm_email(request):
    try:
        user_otp = request.data['otp'].strip()
        email = request.data['email'].strip()
        try:
            validate_email(email)
        except ValidationError as e:
            return Response({"message": "Invalid Email"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(email=email).order_by('-timestamp').first()
        if otp_obj and otp_obj.otp:
            result = check_email_otp(otp_obj, user_otp)
            if isinstance(result, Response):
                return result
            else:
                logging.info(f"Email verified: {email}")
                return Response({'message': 'OTP Verified'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        message = 'An error occurred while verifying the email'
        logging.exception(f"{message} in confirm_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', block=True)
def verify_phone(request):
    try:
        TEMPLATE_NAME = "Register_Mobile_Verification"

        phone = request.data['phone'].strip()
        if not re.match(r'^\d{10}$', phone):
            return Response({"message": "Phone number must be exactly 10 digits"}, status=status.HTTP_400_BAD_REQUEST)

        is_req_pending = RequestUser.objects.filter(user_phone=phone, seen=False).exists()
        if is_req_pending:
            return Response({"message": "Your Sign Up request is pending! Please wait for some time."}, status=status.HTTP_400_BAD_REQUEST)

        phone_number = User.objects.filter(phone=phone).first()
        if phone_number:
            return Response({'message': 'Number already registered'}, status=status.HTTP_409_CONFLICT)

        session_id = send_otp_request(phone, TEMPLATE_NAME)
        if session_id:
            OTP.objects.create(phone=phone, session_id=session_id)
            return Response({'message': 'OTP request sent successfully. Please check your phone.'}, status=status.HTTP_200_OK)
        else:
            error_message = {"message": "Failed to send OTP request. Please check your Number"}
            return Response(error_message, status=status.HTTP_400_BAD_REQUEST)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while sending the mobile OTP'
        logging.exception(f"{message} in verify_phone: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', block=True)
def confirm_phone_ver(request):
    try:
        otp_code = request.data['otp'].strip()
        phone = request.data['phone'].strip()

        if not re.match(r'^\d{10}$', phone):
            return Response({"message": "Phone number must be exactly 10 digits"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(phone=phone).order_by('-timestamp').first()
        if otp_obj:
            result = check_mobile_otp(otp_obj, otp_code)
            if isinstance(result, Response):
                return result
            else:
                logging.info(f"Phone verified: {phone}")
                return Response({'message': 'OTP Verified'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while verifying the OTP'
        logging.exception(f"{message} in confirm_phone_ver: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['railway admin'])
def show_requested_user(request):
    try:
        user_json = serializers.serialize('json', [request.user])
        all_stations = Station.objects.all().values()
        user_requested = RequestUser.objects.filter(seen=False).values()

        context = {
            'user_requested': user_requested, 
            'all_stations': all_stations, 
            'user': user_json
            }
        return Response(context, status=status.HTTP_200_OK)

    except Exception as e:
        logging.exception(f"An error occurred in show_requested_user: {repr(e)}")
        return Response({'message': f'An error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['railway admin'])
def user_requested(request, user_id):
    try:
        arg = request.data.get('q')
        is_approved = arg == "APPROVE"

        try:
            user = RequestUser.objects.get(id=user_id)
        except RequestUser.DoesNotExist:
            return Response({'message': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

        user.seen = True
        user.save()
        if is_approved:
            user.approved = True
            user.save()
            username = f"{user.user_f_name}_{user.user_phone}"
            password = make_password(user.user_password)
            try:
                user_type = Roles.objects.get(name=user.user_type)
                station = Station.objects.get(station_code=user.user_station)
            except ObjectDoesNotExist as e:
                return Response({"message": e.args[0]}, status=status.HTTP_404_NOT_FOUND)

            all_posts = str(user.user_posts)
            posts = re.split(r'\s+|,\s*|\s*,', all_posts)

            create_user = User.objects.create(
                first_name=user.user_f_name,
                middle_name=user.user_m_name,
                last_name=user.user_l_name,
                username=username,
                password=password,
                email=user.user_email,
                phone=user.user_phone,
                user_type=user_type,
                station=station
            )
            try:
                if user.user_type == 'railway admin':
                    create_user.railway_admin = True
                    create_user.staff = True
                create_user.save()
                logging.info("User created")

            except Exception as e:
                message = {"message": "An error occurred while saving the user"}
                logging.exception(f"{message} in user_requested : {repr(e)}")
                return Response(message, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if user.user_type != 'railway admin':
                try:
                    Assign_Permission.objects.create(user=create_user)
                    logging.info("Permissions added")

                except Exception as e:
                    message = 'An error occurred while assigning permissions'
                    logging.exception(f"{message} in user_requested: {repr(e)}")
                    return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            try:
                for post in posts:
                    content = post.upper()
                    post1, created = Post.objects.get_or_create(
                        content=content)
                    post1.save()
                    create_user.posts.add(post1)
                    create_user.save()
            except Exception as e:
                logging.error(f"Error in Post model: {repr(e)}")

            subject = "User Request Approved"
            email_template_name = "email/user_approved.txt"
            c = {
                "email": create_user.email,
                "phone": create_user.phone,
                "password": user.user_password,
                'role': user.user_type,
                'station': station.station_name,
                'domain': DOMAIN,
                'site_name': 'Website',
                'protocol': 'https',
                'app_link': 'https://play.google.com/store/apps/details?id=com.suvidhaen.swachhdnr',
            }
            email = render_to_string(email_template_name, c)
            try:
                send_mail(
                    subject, 
                    email,
                    EMAIL_SENDER, 
                    [create_user.email], 
                    fail_silently=False
                    )
                logging.info(f'User approval email sent to {create_user.email}')
                user_data = UserSerializer(create_user).data
                return Response({'message': 'User Approved', 'user': user_data}, status=status.HTTP_200_OK)

            except Exception as e:
                message = f"Mail didn't send to {create_user.email}"
                logging.exception(f"{message} with exception: {repr(e)}")
                return Response({'message': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logging.info("User denied")
            return Response({'message': 'User Denied'}, status=status.HTTP_200_OK)

    except Exception as e:
        message = 'An error occurred while processing the user request'
        logging.exception(f'{message} in user_requested: {repr(e)}')
        return Response({'message': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['railway admin'])
def enable_disable_user(request):
    try:
        users = User.objects.all()
        users_list = []
        for user in users:
            user_dict = {}
            user_dict['username'] = user.username
            user_dict['enabled'] = user.enabled
            user_dict['email'] = user.email
            user_dict['phone'] = user.phone
            user_dict['role'] = user.user_type.name
            user_dict['station'] = user.station.station_name
            users_list.append(user_dict)

        if request.method == "POST":
            data = request.data
            for user in users_list:
                if data.get(user['username']) == "enabled":
                    marked_status = True
                else:
                    marked_status = False
                if user['enabled'] != marked_status:
                    try:
                        user_changed = User.objects.get(username=user['username'])
                    except User.DoesNotExist:
                        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
                    user_changed.enabled = marked_status
                    user_changed.save()
        context = {
            'users': users_list
        }
        return Response(context, status=status.HTTP_200_OK)

    except Exception as e:
        message = 'An error occurred while enabling/disabling the user'
        logging.exception(f'{message} in enable_disable_user: {repr(e)}')
        return Response({'message': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
