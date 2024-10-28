from rest_framework import serializers
from django.contrib.auth.models import update_last_login
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings
from django.template.loader import render_to_string
from django.core.mail import send_mail, send_mass_mail
from django.core.validators import MinLengthValidator, RegexValidator, EmailValidator
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.validators import UniqueValidator
import logging
import re

from station.models import Station
from user_onboarding.models import RequestAccess, User, RequestUser, Roles
from user_onboarding.library.sociallib import google
from user_onboarding.library.login.social_login import login_social_user
from cms.settings import EMAIL_SENDER, DOMAIN


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'user_type', 'first_name', 'middle_name', 'last_name', 'phone', 'station')


class RequestUserSerializer(serializers.Serializer):
    f_name = serializers.CharField(
        validators=[MinLengthValidator(2, "First Name must be at least two characters!"), 
                    RegexValidator(r'^[a-zA-Z]+$', "First Name can only contain alphabets!")])
    m_name = serializers.CharField(
        required=False, 
        validators=[RegexValidator(r'^[a-zA-Z]*$', "Middle Name can only contain alphabets!")])
    l_name = serializers.CharField(
        validators=[MinLengthValidator(2, "Last Name must be at least two characters!"), 
                    RegexValidator(r'^[a-zA-Z]+$', "Last Name can only contain alphabets!")])
    email = serializers.CharField(
        validators=[EmailValidator(), 
                    UniqueValidator(queryset=User.objects.all(), message="Email Already Taken")])
    phone = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="Phone Number Already Exist")])
    password = serializers.CharField()
    re_password = serializers.CharField()
    user_type = serializers.CharField()
    station = serializers.IntegerField()
    posts = serializers.CharField()


    def validate(self, data):
        try:
            f_name = data["f_name"].strip()
            m_name = data.get("m_name")
            if m_name:
                m_name = m_name.strip()
            l_name = data["l_name"].strip()
            email = data["email"].strip()
            phone = data["phone"].strip()
            password = data["password"].strip()
            re_password = data["re_password"].strip()
            user_type = data["user_type"].strip()
            station = data["station"]
            posts = data["posts"].strip()
        except KeyError as e:
            raise serializers.ValidationError(f"Missing: {e.args[0]}")

        if not re.match(r'^\d{10}$', phone):
            raise serializers.ValidationError("Phone number must be exactly 10 digits")

        elif password != re_password:
            raise serializers.ValidationError( "Passwords Do not Match!")
        
        return data
    
    def save(self):
        f_name = self.validated_data.get("f_name")
        m_name = self.validated_data.get("m_name")
        l_name = self.validated_data.get("l_name")
        email = self.validated_data.get("email")
        phone = self.validated_data.get("phone")
        password = self.validated_data.get("password")
        user_type = self.validated_data.get("user_type")
        station = self.validated_data.get("station")
        posts = self.validated_data.get("posts")

        user = RequestUser()
        user.user_f_name = f_name
        user.user_m_name = m_name
        user.user_l_name=l_name
        user.user_password=password
        user.user_email=email
        user.user_phone=phone
        user.user_type=user_type
        user.user_station=station
        user.user_posts=posts
        user.save()

    
        if user:
            admins = User.objects.filter(railway_admin=True).all()
            user_station = Station.objects.get(station_code=station)

            subject = "New User Request"
            email_template_name = "email/user-requested.txt"
            c = {   
                "email": email,
                "phone": phone,
                "first_name": f_name,
                "station": user_station.station_name,
                "role": user_type,
                'domain': DOMAIN,
                'site_name': 'Website',
                'protocol': 'https',
            }
            message = render_to_string(email_template_name, c)
            mails = [(subject, message, EMAIL_SENDER, [admin.email for admin in admins])]
            try:
                send_mass_mail(mails, fail_silently=False)
                logging.info(f"User request submitted with email: {email} & phone: {phone}")
                logging.info(f"Mail sent to: {[admin.email for admin in admins]}")

            except Exception as e:
                logging.exception(f"Mail was not sent with exception: {repr(e)}")

            subject_user = "User Request Pending"
            email_template_name_user = "email/pending-user.txt"
            c_user = {
                "email": email,
                "phone": phone,
                "password": password,
                'role': user_type,
                'station' : user_station.station_name,
                'domain': DOMAIN,
                'site_name': 'Website',
                'protocol': 'https',
                'app_link': 'https://play.google.com/store/apps/details?id=com.suvidhaen.swachhdnr',
            }
            email_user = render_to_string(email_template_name_user, c_user)
            try:
                send_mail(subject_user, email_user, EMAIL_SENDER, [user.user_email], fail_silently=False)
                logging.info(f"Mail sent to: {[user.user_email]}")

            except Exception as e:
                logging.exception(f"Mail was not sent with exception: {repr(e)}")
        
        return user


class UserLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(
        validators=[RegexValidator(r'^\d{10}$', "Invalid Phone number")], write_only=True)
    password = serializers.CharField(write_only=True)


    @classmethod
    def get_token(cls, user):
        return RefreshToken.for_user(user)


    def validate(self, attr):
        phone = attr.get("phone")
        password = attr.get("password")
        request = self.context.get('request')

        if phone is not None and isinstance(phone, str):
            phone = phone.strip()
        elif not re.match(r'^\d{10}$', phone):
            raise serializers.ValidationError("Phone number must be exactly 10 digits")
        elif not password:
            raise serializers.ValidationError("Please select valid Password")

        user_password = None
        user = User.objects.filter(phone=phone).first()
        if user:
            user_password = user.check_password(password)
            if user_password:                
                if user.enabled:
                    try:
                        username = user.username
                        user_type = user.user_type.name
                        auth_user = authenticate(request, username=username, password=password)
                    except Exception as e:
                        raise serializers.ValidationError(f"Couldn't complete the authentication with the error: {repr(e)}")
                    if auth_user:
                        response_user_onboarding = {}
                        refresh_token = self.get_token(user)
                        response_user_onboarding['refresh_token'] = str(refresh_token)
                        response_user_onboarding['access_token'] = str(refresh_token.access_token)
                        response_user_onboarding['username'] = username
                        response_user_onboarding['user_type'] = user_type
                        response_user_onboarding['station'] = user.station.station_code
                        response_user_onboarding['station_category'] = user.station.station_category
                        response_user_onboarding['station_name'] = user.station.station_name
                        response_user_onboarding['phone_number'] = phone

                        if api_settings.UPDATE_LAST_LOGIN:
                            update_last_login(None, user)

                        logging.info(f"User: {username} logged in successfully using credentials.")
                        return response_user_onboarding
                    else:
                        raise serializers.ValidationError("Invalid mobile number or password.")
                else:
                    raise serializers.ValidationError("User is not enabled")
            else:
                raise serializers.ValidationError("Password is incorrect.")
        else:
            raise serializers.ValidationError("User with mobile number not exist!")
        

class GoogleSocialAuthSerializer(serializers.Serializer):
    auth_token = serializers.CharField()


    def validate_auth_token(self, auth_token):
        user_data = google.Google.validate(auth_token)

        if user_data.get('sub') is None:
            raise serializers.ValidationError('The token is missing the required user identifier. Please login again.')
        
        if user_data.get('aud') != settings.GOOGLE_CLIENT_ID:
            raise AuthenticationFailed('The token does not match the expected client ID.')
        
        user_id = user_data.get('sub')
        email = user_data.get('email')
        name = user_data.get('name')
        provider = 'google'

        return login_social_user(
            provider=provider, user_id=user_id, email=email, name=name, request=self.context["request"])

    # def get_serializer_context(self):
    #     context = super().get_serializer_context()
    #     context.update({"request": self.request})
    #     return context


class RequestAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestAccess
        fields = '__all__'
