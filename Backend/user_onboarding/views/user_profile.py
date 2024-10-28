from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core import serializers
from django_ratelimit.decorators import ratelimit
from django.core.validators import EmailValidator
import ast
import re
import logging

from ..models import User, Post, OTP, RequestAccess
from station.models import Station
from ..forms import ChangePassword
from ..otp_auth import send_otp_request, send_email_otp, check_mobile_otp, check_email_otp


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def profile(request):
    try:
        user = request.user
        user_json = serializers.serialize('json', [user])
        all_posts = user.posts.all()
        posts = [post.content for post in all_posts] or None

        context = {"user": user_json, "posts": posts, 'role': user.user_type.name}
        return Response(context, status=status.HTTP_200_OK)
    
    except Exception as e:
        logging.exception(f"An error occured in profile: {repr(e)}")
        return Response({"message": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def edit_profile(request):
    try:
        user = request.user
        user_json = serializers.serialize('json', [user])
        all_posts = user.posts.all()
        posts = [post.content for post in all_posts] or None
        stations = Station.objects.all().values_list()
        assigned_station = user.station.station_id if user.station else None
        all_requests = RequestAccess.objects.filter(user_phone=user.phone, access_requested="Access Station")
        station_data = {}
        approved_stations = {}
        for requests in all_requests:
            stations_list = ast.literal_eval(requests.for_station)  # Assuming request.for_station is a list
            from_date = requests.from_for_station
            to_date = requests.to_for_station
            approved = requests.approved
            seen = requests.seen

            # Iterate through the list of stations in the request
            if approved == False and seen == False:
                approved = "Pending"
                for station in stations_list:
                    if station not in station_data:
                        station_data[station] = []  # Initialize an empty list for the station if it doesn't exist
                    station_data[station].append((from_date, to_date, approved))
            elif approved == True and seen == True:
                approved = "Approved"
                for station in stations_list:
                    if station not in approved_stations:
                        approved_stations[station] = []
                    approved_stations[station].append((from_date, to_date, approved))

        if request.method == 'POST':
            try:
                fname = request.data['fname']
                mname = request.data['mname']
                lname = request.data['lname']
                all_posts = str(request.data['posts'])
                user.posts.clear()
            except KeyError as e:
                return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

            posts = re.split(r'\s+|,\s*|\s*,', all_posts)
            for post in posts:
                content = post.upper()
                post1, created = Post.objects.get_or_create(content=content)
                user.posts.add(post1)
                user.save()

            if len(fname) < 3:
                return Response({"message": "First Name must be at least three characters!"}, status=status.HTTP_400_BAD_REQUEST)

            elif not fname.isalpha():
                return Response({"message": "First Name can only contain alphabets!"}, status=status.HTTP_400_BAD_REQUEST)

            elif mname and not re.match(r'^[a-zA-Z]+$', mname):
                return Response({"message": "Middle Name can only contain alphabets!"}, status=status.HTTP_400_BAD_REQUEST)

            elif not lname.isalpha():
                return Response({"message": "Last Name can only contain alphabets!"}, status=status.HTTP_400_BAD_REQUEST)

            elif len(lname) < 3:
                return Response({"message": "Last Name must be at least three characters!"}, status=status.HTTP_400_BAD_REQUEST)

            else:
                user.first_name = fname
                user.middle_name = mname
                user.last_name = lname
                user.username = f"{fname}_{user.phone}"
                user.save()

                user_json = serializers.serialize('json', [user])
                all_posts = user.posts.all()
                posts = [post.content for post in all_posts] or None
                context = {
                    "message": "Successfully Updated Profile",
                    "user": user_json, 
                    "posts": posts, 
                    'role': user.user_type.name
                    }
                return Response(context, status=status.HTTP_200_OK)

        context = {"user": user_json, "posts": posts, 'role': user.user_type.name, 'stations': stations, 'assigned_station': assigned_station, 'station_data': station_data, 'approved_stations': approved_stations}
        return Response(context, status=status.HTTP_200_OK)
    
    except Exception as e:
        message = 'An error occurred while updating the profile'
        logging.exception(f"{message} in edit_profile: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def change_password(request):
    try:
        user = request.user
        form = ChangePassword(request.data, user=user)
        mode = request.data['send_otp']
        if form.is_valid():
            new = form.cleaned_data.get('new_password1')
            if mode == 'M':
                TEMPLATE_NAME = "Change_Password"
                user_mobile = request.user.phone
                session_id = send_otp_request(str(user_mobile), TEMPLATE_NAME)

                if session_id:
                    OTP.objects.create(phone=user_mobile, session_id=session_id, data=new)
                    return Response({"success": "OTP sent successfully. Please check your phone."}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Failed to send OTP request. Please check your Number"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return send_email_otp(
                    email=request.user.email, 
                    subject='Change Your Password', 
                    email_template_name='email/email_otp.txt',
                    otp_data=new
                    )
        else:
            errors = []
            for field, error in form.errors.items():
                errors.append(error[0])
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        message = 'An error occurred while sending the OTP'
        logging.exception(f"{message} in change_password: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def change_pass_otp(request):
    try:
        user_otp = request.data['otp']
        phone = request.user.phone
        email = request.user.email
        otp_obj_phone = OTP.objects.filter(phone=phone).order_by('-timestamp').first()
        otp_obj_email = OTP.objects.filter(email=email).order_by('-timestamp').first()

        if otp_obj_phone and otp_obj_phone.session_id:
            result = check_mobile_otp(otp_obj_phone, user_otp)
            if isinstance(result, Response):
                return result
            else:
                new = result[1]
                request.user.set_password(new)
                request.user.save()
                message = "You have successfully changed your password. Please login with the New Password."
                return Response({"message": message}, status=status.HTTP_200_OK)
            
        elif otp_obj_email and otp_obj_email.otp:
            result = check_email_otp(otp_obj_email, user_otp)
            if isinstance(result, Response):
                return result
            else:
                new = result[1]
                request.user.set_password(new)
                request.user.save()
                message = "You have successfully changed your password. Please login with the New Password."
                return Response({"message": message}, status=status.HTTP_200_OK)
        
        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        message = 'An error occurred while changing the password'
        logging.exception(f"{message} in change_pass_otp: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def change_phone(request):
    try:
        TEMPLATE_NAME = "Changing+Mobile+Number"
        mobile = request.data['phone'].strip()

        if not re.match(r'^\d{10}$', mobile):
            return Response({"message": "Phone number must be exactly 10 digits"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(phone=mobile).first()

        if not user:
            session_id = send_otp_request(str(mobile), TEMPLATE_NAME)

            if session_id:
                OTP.objects.create(phone=mobile, session_id=session_id)
                return Response({"message": "OTP sent successfully. Please check your phone."}, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Failed to send OTP request. Please check your Number"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"message": "Mobile Number Already Exist!"}, status=status.HTTP_400_BAD_REQUEST)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while sending the OTP to your mobile number'
        logging.exception(f"{message} in change_phone: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def confirm_change_phone(request):
    try:
        otp_code = request.data['otp'].strip()
        phone = request.data['phone'].strip()

        if not re.match(r'^\d{10}$', phone):
            return Response({"error": "Phone number must be exactly 10 digits"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(phone=phone).order_by('-timestamp').first()
        if otp_obj:
            result = check_mobile_otp(otp_obj, otp_code)
            if isinstance(result, Response):
                return result
            else:
                request.user.phone = phone
                request.user.username = f"{request.user.first_name}_{phone}"
                request.user.save()
                return Response({'message': 'Mobile Number updated successfully.'}, status=status.HTTP_200_OK)
                
        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)

    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while changing your mobile number'
        logging.exception(f"{message} in confirm_change_phone: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def change_email(request):
    try:
        new_email = request.data['email'].strip()
        
        user = User.objects.filter(email=new_email).first()
        if user:
            return Response({"message": "Email Already Taken!"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user:
            return send_email_otp(
                email=new_email, 
                subject='Verify Your Email', 
                email_template_name='email/email_otp.txt',
                otp_data=None
                )

    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while mailing the OTP'
        logging.exception(f"{message} in change_email: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def change_email_otp(request):
    try:
        user_otp = request.data['otp']
        email = request.data['email']

        email_validator = EmailValidator()
        try:
            email_validator(email)
        except Exception as e:
            return Response({"message": "Invalid Email"}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTP.objects.filter(email=email).order_by('-timestamp').first()
                
        if otp_obj and otp_obj.otp:
            result = check_email_otp(otp_obj, user_otp)
            if isinstance(result, Response):
                return result
            else:
                request.user.email = email
                request.user.save()
                return Response({"message": "Email ID updated successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while changing the email'
        logging.exception(f"{message} in change_email_otp: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def deactivate_account(request):
    try:
        user = request.user
        user.enabled = False
        user.save()
        return Response({"message": "Account successfully deactivated"}, status=status.HTTP_200_OK)

    except Exception as e:
        message = 'An error occurred while deactivating the account the user'
        logging.exception(f'{message} in deactivate_account: {repr(e)}')
        return Response({'message': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
