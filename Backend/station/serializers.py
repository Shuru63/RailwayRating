from rest_framework import serializers
from .models import Station


class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = [
            'id', 
            'station_name', 
            'station_zone', 
            'station_id', 
            'station_category', 
            'is_hq', 
            'is_chi_sm', 
            'parent_station'
            ]
