import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .models import Pax
from user_onboarding.models import Roles
from shift.models import Shift
from .serializers import PaxSerializer
from website.utils import check_permission


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class PaxAPI(APIView):
    def post(self, request, date=None, shift_id=None, format=None):
        try:
            data = request.data.copy()
            user = request.user
            station = user.station

            try:
                shift = Shift.objects.get(shift_id=shift_id, station=station)
            except Shift.DoesNotExist:
                return Response({"message": "Shift not foound"}, status=status.HTTP_404_NOT_FOUND)
            
            if not data.get('count'):
                return Response({'message': 'Please enter the number of Pax deployed'}, status=status.HTTP_400_BAD_REQUEST)
            
            check = check_permission(user)
            role = user.user_type
            sup = role.name
            if check and sup in ["supervisor", 'officer', 'railway admin', 'chi_sm']:
                data['Pax_status'] = data['status'].lower()
                data['date'] = date
                data['shift'] = shift.id
                data['user'] = user.id

                serializer = PaxSerializer(data=data, partial=True)
                if serializer.is_valid(raise_exception=True):
                    serializer.save(created_by=user.username, updated_by=user.username)
                    response_data = {'message': 'Pax deployed successfully', 'data': serializer.data}
                    return Response(response_data, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': f"{sup} don't have permission"}, status=status.HTTP_403_FORBIDDEN)
            
        except KeyError as e:
            return Response({"message": f"Data missing: {e.args[0]}"}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logging.exception(f"An error occurred while pax deployment; {repr(e)}")
            return Response({"message": "An error occurred in PaxAPI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def put(self, request, pax_id=None, format=None):
        try:
            data = request.data.copy()
            user = request.user
            try:
                pax = Pax.objects.get(id=pax_id)
            except Pax.DoesNotExist:
                return Response({"message": "Pax does not exist"}, status=status.HTTP_404_NOT_FOUND)

            if not data.get('count'):
                return Response({'message': 'Please enter the number of Pax deployed'}, status=status.HTTP_400_BAD_REQUEST)

            check = check_permission(user)
            role = user.user_type
            sup = role.name
            if check and sup in ["supervisor", 'officer', 'railway admin', 'chi_sm']:
                data['date'] = pax.date
                data['shift'] = pax.shift.id
                data['user'] = user.id
                data['updated_by'] = user.username
                serializer = PaxSerializer(pax, data=data, partial=True)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()
                    response_data = {'message': 'Pax updated successfully', 'data': serializer.data}
                    return Response(response_data, status=status.HTTP_200_OK)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': f"{sup} doesn't have permission"}, status=status.HTTP_403_FORBIDDEN)
            
        except Exception as e:
            logging.exception(f"An error occurred while updating pax: {repr(e)}")
            return Response({"message": "An error occurred in PaxAPI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
@method_decorator(ratelimit(key='ip', rate='50/m', block=True), name='dispatch')
class FetchPaxAPI(APIView):
    def get(self, request, date=None, format=None):
        try:
            user = request.user
            check = check_permission(user)
            role = user.user_type
            sup = role.name
            if check and sup in ["supervisor", 'officer', 'railway admin', 'chi_sm']:
                all_pax = Pax.objects.filter(date=date, shift__station=user.station)
                shift1_pax_status = ''
                shift2_pax_status = ''
                shift3_pax_status = ''
                for pax in all_pax:
                    if pax.shift.shift_id == 1:
                        shift1_pax_status = pax.Pax_status
                    elif pax.shift.shift_id == 2:
                        shift2_pax_status = pax.Pax_status
                    elif pax.shift.shift_id == 3:
                        shift3_pax_status = pax.Pax_status
                        

                all_pax = PaxSerializer(all_pax, many=True)
                return Response({'message': 'Pax Fetched successfully', 'paxs': all_pax.data, 'shift1_pax_status': shift1_pax_status, 'shift2_pax_status': shift2_pax_status, 'shift3_pax_status': shift3_pax_status}, status=status.HTTP_200_OK)

            else:
                return Response({'message': f"{sup} don't have permission"}, status=status.HTTP_403_FORBIDDEN)
            
        except Exception as e:
            logging.exception(f"An error occurred while fetching the pax: {repr(e)}")
            message = {"message": "An error occurred in FetchPaxAPI"}
            return Response(message, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
