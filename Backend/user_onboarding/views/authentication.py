import logging
import re
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenViewBase
from django.contrib.auth.models import update_last_login
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth import login
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework.generics import GenericAPIView
from user_onboarding.serializers import GoogleSocialAuthSerializer
from rest_framework.permissions import AllowAny

from ..models import User, OTP
from ..otp_auth import send_otp_request, check_mobile_otp
from ..serializers import UserLoginSerializer


@method_decorator(ratelimit(key='ip', rate='10/m', block=True), name='dispatch')
class UserLoginView(TokenViewBase):
    serializer_class = UserLoginSerializer


@method_decorator(ratelimit(key='ip', rate='10/m', block=True), name='dispatch')
@permission_classes([IsAuthenticated])
class UserLogoutView(APIView):
    def delete(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token is not None:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Refresh Token is missing"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            message = 'An error occurred while logging out'
            logging.exception(F"{message} in UserLogoutView: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', block=True)
def login_using_otp_send(request):
    try:
        TEMPLATE_NAME = "Login+via+OTP"

        to = request.data['phone_number'].strip()
        if not re.match(r'^\d{10}$', to):
            return Response({"message": "Phone number must be exactly 10 digits"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            User.objects.get(phone=to)
        except User.DoesNotExist:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        session_id = send_otp_request(to, TEMPLATE_NAME)
        if session_id:
            OTP.objects.create(phone=to, session_id=session_id)
            return Response({"message": "OTP request sent successfully. Please check your phone."}, status=status.HTTP_200_OK)
        else:
            error_message = "Failed to send OTP request. Please check your number."
            return Response({"message": error_message}, status=status.HTTP_400_BAD_REQUEST)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while sending the OTP'
        logging.exception(F"{message} in login_using_otp_send: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@ratelimit(key='ip', rate='10/m', block=True)
def login_using_otp_verify(request):
    try:
        otp_code = request.data['login_code'].strip()
        phone = request.data['phone'].strip()
        
        otp_obj = OTP.objects.filter(phone=phone).order_by('-timestamp').first()
        if otp_obj:
            result = check_mobile_otp(otp_obj, otp_code)
            if isinstance(result, Response):
                return result
            else:
                try:
                    user = User.objects.get(phone=phone)
                except User.DoesNotExist:
                    return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
                
                login(request, user)
                refresh_token = RefreshToken.for_user(user)
                context = {
                    "message": "Logged in successfully",
                    "refresh_token": str(refresh_token),
                    "access_token": str(refresh_token.access_token),
                    "username": user.username,
                    "user_type": user.user_type.name,
                    "station": user.station.station_code,
                    "station_name": user.station.station_name,
                    "station_category": user.station.station_category,
                    "phone_number": user.phone
                }

                if api_settings.UPDATE_LAST_LOGIN:  
                    update_last_login(None, user)
                    
                logging.info(f"User {user.username} logged in successfully using SMS OTP")
                return Response(context, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'OTP not found. Please generate a new OTP.'}, status=status.HTTP_404_NOT_FOUND)

    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred while verifying the OTP and logging in'
        logging.exception(f"{message} in login_using_otp_verify: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes((AllowAny, ))
class GoogleSocialAuthView(GenericAPIView):
    serializer_class = GoogleSocialAuthSerializer


    def post(self, request):
        """
        POST with "auth_token"
        Send an idtoken as from google to get user information
        """
        try:
            serializer = self.serializer_class(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            data = ((serializer.validated_data)['auth_token'])
            return data
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
