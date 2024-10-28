import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Station
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import ListAPIView
from .serializers import StationSerializer


@permission_classes([AllowAny])
class StationListAPI(APIView):
    def get(self, request, format=None):
        stations = Station.objects.all().order_by('station_id')
        serializer = StationSerializer(stations, many=True)
        return Response(serializer.data)


@permission_classes([IsAuthenticated])
class HQStationsAPI(APIView):
    def get(self, request, format=None):
        try:
            hq_stations = Station.objects.filter(is_hq=True)
            serialized_hq_stations = StationSerializer(hq_stations, many=True).data
            hq_with_monitoring = []
            for serialized_hq_station in serialized_hq_stations:
                monitoring_stations = Station.objects.filter(parent_station=serialized_hq_station['id'])
                serialized_monitoring_stations = StationSerializer(monitoring_stations, many=True).data

                hq_with_monitoring.append({
                    'hq_station': serialized_hq_station,
                    'monitoring_stations': serialized_monitoring_stations
                })

            return Response(hq_with_monitoring, status=status.HTTP_200_OK)

        except Exception as e:
            message = 'An error occured while retrieving hq stations'
            logging.exception(f"{message} in HQStationsAPI: {repr(e)}")
            return Response({"message": message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class ParentStationDetailAPI(ListAPIView):
    serializer_class = StationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        parent_station_code = self.kwargs['parent_station_code']
        return Station.objects.filter(parent_station__station_code=parent_station_code)
