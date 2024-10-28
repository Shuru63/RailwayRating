import logging
from smtplib import SMTPSenderRefused, SMTPRecipientsRefused
from django.core.mail import send_mail, BadHeaderError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.template.loader import render_to_string
from django_ratelimit.decorators import ratelimit
from rest_framework.response import Response
from rest_framework import status
from django.core import serializers
import json
import ast
import datetime
from ratings.views.funcs import prev_page_url
from station.serializers import StationSerializer
from user_onboarding.serializers import RequestAccessSerializer

from website.decorators import allowed_users
from station.models import Access_Station, Station
from ..models import User, RequestAccess
from cms.settings import EMAIL_SENDER, DOMAIN, APP_LINK
from django.core.exceptions import ObjectDoesNotExist, ValidationError


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['railway admin'])
def show_requested_access(request):
    try:
        current_user = request.user
        all_stations = Station.objects.all().values_list()
        current_user_station = current_user.station
        station_json = serializers.serialize('json', [current_user_station])
        user_requested = RequestAccess.objects.filter(seen=False).values_list()

        context = {
            'user_requested': user_requested,
            'all_stations': all_stations,
            'current_user_station': station_json,
        }
        return Response(context, status=status.HTTP_200_OK)
        
    except Exception as e:
        message = 'An error occurred while showing access requests'
        logging.exception(f"{message} in show_requested_access: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(['railway admin'])
def access_requested(request, user_id, access_requested):
    try:
        current_user = request.user
        arg = request.data['q']
        is_approved = arg == "APPROVE"

        try:
            user = RequestAccess.objects.get(id=user_id)
        except RequestAccess.DoesNotExist:
            return Response({'message': 'Access request does not exist'}, status=status.HTTP_404_NOT_FOUND)

        user.seen = True
        user.save()
        if is_approved:
            user.approved = True
            user.save()
            updated_station = False
            try:
                current_user = User.objects.get(phone=user.user_phone)
                prev_station = current_user.station.station_name
            except User.DoesNotExist:
                return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            if access_requested == 'Change Station':
                station = Station.objects.filter(station_name=user.for_station).first()
                if not station:
                    return Response({"message": "Station not found"}, status=status.HTTP_404_NOT_FOUND)
                current_user.station = station
                current_user.save()
                updated_station = True
                message = f"Successfully changed the user's station: {prev_station} to {station.station_name}"

            elif access_requested == 'Access Station':
                station_names_string = user.for_station
                station_names = [name.strip("'") for name in station_names_string.strip('[]').split(', ')]
                all_stations = Station.objects.all()
                access_to_stations = []

                for station_name in station_names:
                    station_instance = all_stations.filter(
                        station_name=station_name).first()
                    if station_instance:
                        access_to_stations.append(station_instance)
                    else:
                        return Response({'message': f'Station with name {station_name} not found.'}, status=status.HTTP_400_BAD_REQUEST)

                access_station, created = Access_Station.objects.get_or_create(
                    user_name=current_user.username)

                station_data = []

                if access_station.access_stations:
                    existing_station_data = json.loads(
                        access_station.access_stations)
                    if isinstance(existing_station_data, list):
                        station_data = existing_station_data

                current_station_data = {
                    'station_name': current_user.station.station_name,
                    'from': datetime.datetime.now().strftime('%Y-%m-%d'),
                    'to': 'Infinity'
                }

                for entry in station_data:
                    if entry['station_name'] == current_station_data['station_name']:
                        entry['from'] = current_station_data['from']
                        entry['to'] = current_station_data['to']
                        break
                else:
                    station_data.append(current_station_data)
                for station_instance in access_to_stations:
                    from_date_str = user.from_for_station
                    to_date_str = user.to_for_station

                    try:
                        from_date = datetime.datetime.strptime(
                            from_date_str, '%Y-%m-%d')
                        to_date = datetime.datetime.strptime(
                            to_date_str, '%Y-%m-%d')

                        from_date_new = from_date.strftime('%d-%m-%Y')
                        to_date_new = to_date.strftime('%d-%m-%Y')
                    except Exception as e:
                        logging.exception(f"The date strings couldn't be parsed with the expected format: {repr(e)}")
                        return Response({"message": "An error occurred while parsing the dates"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                    new_station_data = {
                        'station_name': station_instance.station_name,
                        'from': from_date_new,
                        'to': to_date_new
                        }

                    for entry in station_data:
                        if entry['station_name'] == new_station_data['station_name']:
                            entry['from'] = new_station_data['from']
                            entry['to'] = new_station_data['to']
                            break
                    else:
                        station_data.append(new_station_data)

                station_data_json = json.dumps(station_data)
                access_station.access_stations = station_data_json
                access_station.save()

                updated_station = True
                message = f"The user {current_user} with access to {current_user.station} has its access updated to {access_to_stations} for {user.from_for_station} to {user.to_for_station}"
            else:
                updated_station = False

            # Mail the user for acceptance
            if updated_station:
                subject = "User Request Approved"
                email_template_name = "email/access_approved.txt"
                c = {
                    "email": user.user_email,
                    "phone": user.user_phone,
                    'role': user.user_type,
                    'request': 'Access Station' if access_requested == 'Access Station' else 'Change Station',
                    'station': user.for_station,
                    'from_date': user.from_for_station,
                    'to_date': user.to_for_station,
                    'domain': DOMAIN,
                    'site_name': 'Website',
                    "user": user.user_f_name,
                    'protocol': 'https',
                    'app_link': APP_LINK,
                }
                email = render_to_string(email_template_name, c)
                try:
                    send_mail(subject, email, EMAIL_SENDER, [user.user_email], fail_silently=False)
                    logging.info(f'Approval mail sent to: {user.user_email}')
                    return Response({'message': message}, status=status.HTTP_200_OK)
                
                except BadHeaderError as e:
                    logging.exception(f"Email not sent to: {user.user_email} with exception: {repr(e)}")
                    return Response({"message": "BadHeaderError"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                except SMTPSenderRefused as e:
                    logging.exception(f"Email not sent to: {user.user_email} with exception: {repr(e)}")
                    return Response({"message": "SMTPSenderRefused"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                except SMTPRecipientsRefused as e:
                    logging.exception(f"Email not sent to: {user.user_email} with exception: {repr(e)}")
                    return Response({"message": "SMTPRecipientsRefused"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'message': 'Request Denied'}, status=status.HTTP_200_OK)
        
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        message = 'An error occurred while proccessing the access request'
        logging.exception(f"{message} in access_requested: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(["supervisor", "railway manager", "contractor", "chi_sm"])
def change_accessed_station(request, station_name):
    try:
        user = request.user
        if not station_name.strip():
            message = 'You cannot request for empty values, please provide data to request access'
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)

        station = Station.objects.filter(station_name=station_name).first()
        if not station:
            return Response({"message": "Station does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
        user.station = station
        user.save()
        return Response({'message': 'Station changed successfully to ' + station_name}, status=status.HTTP_200_OK)
        
    except Exception as e:
        message = 'An error occurred while changing the access station'
        logging.exception(f"{message} in change_accessed_station: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
def change_station(request, station_name):
    try:
        user = request.user
        user_role = user.user_type.name
        if not station_name.strip():
            message = 'You cannot request for empty values, please provide data to request access'
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)
        
        station = Station.objects.filter(station_name=station_name).first()
        if not station:
            return Response({"message": "Station does not exist"}, status=status.HTTP_404_NOT_FOUND)

        if user_role in ["officer", "railway admin"]:
            user.station = station
            user.save()
            return Response({'message': 'Station changed successfully to ' + station_name, "station_code":station.station_code}, status=status.HTTP_200_OK)

        elif user_role in ["supervisor", "railway manager", "contractor"]:
            existing_request = RequestAccess.objects.filter(
                user_phone=user.phone,
                user_station=user.station.station_name,
                access_requested="Change Station",
                approved=False,
                seen=False,
            ).first()

            if existing_request:
                message = f"Your request for changing station from {existing_request.user_station} to {existing_request.for_station} is already pending. Please wait for approval"
                return Response({'message': message}, status=status.HTTP_200_OK)
            RequestAccess.objects.create(
                user_f_name=user.first_name,
                user_m_name=user.middle_name,
                user_l_name=user.last_name,
                user_email=user.email,
                user_phone=user.phone,
                user_type=user.user_type.name,
                user_station=user.station.station_name,
                access_requested="Change Station",
                for_station=station_name,
                from_for_station=None,
                to_for_station=None,
            )
            message = f'Mail sent to admin for station change request for {user.username} from {user.station.station_name} to {station.station_name}'
            return Response({'message': message}, status=status.HTTP_200_OK)
        
        else:
            return Response({'message': 'You do not have access to it!'}, status=status.HTTP_403_FORBIDDEN)
        
    except Exception as e:
        message = 'An error occurred while changing the station'
        logging.exception(f"{message} in change_station: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# **************************************************
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(["supervisor", "railway manager", "contractor", "chi_sm"])
def change_station_editprofile(request):
    try:
        user = request.user
        data = request.data
        station_name = data['Change_Station']
        

        if not (isinstance(station_name, str) and station_name != ""):
            message = 'You cannot request access for empty values. Please provide station values to request access.'
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)

        request_access = RequestAccess(
            user_f_name=user.first_name,
            user_m_name=user.middle_name,
            user_l_name=user.last_name,
            user_email=user.email,
            user_phone=user.phone,
            user_type=user.user_type.name,
            user_station=user.station.station_name,
            access_requested="Change Station",
            for_station=[station_name],
        )
        request_access.save()

        return Response({'message': f"Access request for {', '.join(station_name)} created. Please wait for approval."},
                        status=status.HTTP_201_CREATED)
    
    except ValidationError as e:
        return Response({"message": f"Validation error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred'
        logging.exception(f"{message} in access_station: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#  **************************************************
    
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(["supervisor", "chi_sm"])
def home_station(request):
    try:
        user = request.user

        if request.method == 'GET':
            stations = Station.objects.all().order_by('station_id')
            current_station = stations.filter(station_name=user.station.station_name)

            parent_station = current_station[0].parent_station
            print(f"the parent station of {user.station.station_name} station is: {parent_station}")
            if parent_station:
                station = Station.objects.filter(station_name=parent_station).first()
                if not station:
                    return Response({"message": "Station does not exist"}, status=status.HTTP_404_NOT_FOUND)
                user.station = station
                user.save()
                return Response({'message': 'Station changed successfully to ' + user.station.station_name, "station_code": user.station.station_id, 'home_station': user.station.station_name, 'home_station_id': user.station.station_id }, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'You are already at the parent station', 'home_station': user.station.station_name, 'home_station_id': user.station.station_id}, status=status.HTTP_200_OK)            
        elif request.method == 'POST':
            return Response({'message': 'POST request received'}, status=status.HTTP_404_NOT_FOUND)
        
    except json.JSONDecodeError as e:
        message = 'Error decoding JSON'
        logging.exception(f"{message} in new_station_access: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        message = 'An error occurred'
        logging.exception(f"{message} in new_station_access: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# *************************************************  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(["supervisor", "railway manager", "contractor", "chi_sm"])
def access_station(request):
    try:
        user = request.user
        to_save = False
        data = request.data
        station_value = data['station_value']
        start_date = data['start_date']
        end_date = data['end_date']
        
        if not (isinstance(station_value, list) and any(station_value)) or not start_date or not end_date:
            message = 'You cannot request access for empty values, please provide data to request access'
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)

        all_requested_objects = RequestAccess.objects.all()
        object_with_same_stations = []
        for requested_object in all_requested_objects:
            if requested_object.access_requested == "Access Station" and requested_object.user_phone == user.phone:
                if any(station in ast.literal_eval(requested_object.for_station) for station in station_value):
                    object_with_same_stations.append(requested_object)

        # Iterate times as per the number of objects with same stations
        station_to_save = station_value
        messages = []
        if object_with_same_stations:
            for obj in object_with_same_stations:
                for station in station_value:
                    if station in ast.literal_eval(obj.for_station):
                        if start_date == obj.from_for_station and end_date == obj.to_for_station and not obj.seen:
                            messages.append(f"You have a pending request for {station} from {start_date} to {end_date}. Please wait for approval.")
                            station_to_save.remove(station)
                        elif start_date == obj.from_for_station and end_date == obj.to_for_station and obj.approved:
                            messages.append(f"You have already been granted access for {station} from {start_date} to {end_date}. You cannot request again for the same dates.")
                            station_to_save.remove(station)
                        elif start_date != obj.from_for_station or end_date != obj.to_for_station and not obj.seen:
                            obj.from_for_station = start_date
                            obj.to_for_station = end_date
                            obj.save()
                            messages.append(f"You have requested new dates for {station}. We are replacing older dates with new ones. Please wait for approval.")
                            station_to_save.remove(station)
                        elif start_date != obj.from_for_station or end_date != obj.to_for_station and obj.seen and obj.approved:
                            messages.append(f"You have requested new dates for {station}. A new request is being created as the older one was approved for older dates. Please wait for approval.")
                            to_save = True
                        else:
                            messages.append(f"We have created a request to access {station} from {start_date} to {end_date}. Please wait for approval.")
                            to_save = True
                    else:
                        messages.append(f"A request for access to {station} is being created. Please wait for approval.")
                        to_save = True

        if not object_with_same_stations:
            messages.append(f"A request for access to {station_value} is being created. Please wait for approval.")
            to_save = True

            request_access = RequestAccess(
                user_f_name=user.first_name,
                user_m_name=user.middle_name,
                user_l_name=user.last_name,
                user_email=user.email,
                user_phone=user.phone,
                user_type=user.user_type.name,
                user_station=user.station.station_name,
                access_requested="Access Station",
                for_station=station_value,
                from_for_station=start_date,
                to_for_station=end_date,
            )
            request_access.save()
            logging.info("RequestAccess object is created")

        if to_save and station_to_save:
            request_access.save()
            
        return Response({'message': messages}, status=status.HTTP_201_CREATED)
    
    except ValidationError as e:
        return Response({"message": f"Validation error: {e}"}, status=status.HTTP_400_BAD_REQUEST)

    except KeyError as e:
        return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        message = 'An error occurred'
        logging.exception(f"{message} in access_station: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='ip', rate='50/m', block=True)
@allowed_users(["supervisor", "railway manager", "contractor", "chi_sm"])
def new_station_access(request):
    try:
        user = request.user

        if request.method == 'GET':
            access_station = Access_Station.objects.filter(
                user_name=user.username).first()
            if access_station:
                access_stations_data = json.loads(access_station.access_stations)
            else:
                access_stations_data = []
            today = datetime.date.today().strftime('%d-%m-%Y')
            context = {
                'access_stations_data': access_stations_data,
                'current_station': user.station.station_name,
                'today': today
                }
            return Response(context, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            all_requests = RequestAccess.objects.filter(
                user_phone=user.phone, access_requested="Access Station")
            serializer = RequestAccessSerializer(all_requests, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
    except json.JSONDecodeError as e:
        message = 'Error decoding JSON'
        logging.exception(f"{message} in new_station_access: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        message = 'An error occurred'
        logging.exception(f"{message} in new_station_access: {repr(e)}")
        return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
