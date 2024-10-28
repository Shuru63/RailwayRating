import logging
from rest_framework.authtoken.models import Token
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth.models import update_last_login
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken

from user_onboarding.models import User


def login_social_user(provider, user_id, email, name, request):
    filtered_user_by_email = User.objects.filter(email=email)

    if filtered_user_by_email.exists():
        user = User.objects.get(email=email)

        if user:
            login(request, user)
            refresh_token = RefreshToken.for_user(user)
            context = {
                "message": "Logged in successfully",
                "refresh_token": str(refresh_token),
                "access_token": str(refresh_token.access_token),
                "username": user.username,
                "user_type": user.user_type.name,
                "station_name": user.station.station_name,
                "station": user.station.station_code,
                "station_category": user.station.station_category,
                "phone_number": user.phone
            }

            if api_settings.UPDATE_LAST_LOGIN:
                update_last_login(None, user)

            logging.info(f"User {user.username} logged in successfully using {provider} provider")
            return Response(context, status=status.HTTP_200_OK)
        else:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    else:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
