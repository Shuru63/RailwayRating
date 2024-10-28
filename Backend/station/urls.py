from django.urls import path

from .views import (
    StationListAPI, 
    HQStationsAPI, 
    ParentStationDetailAPI
    )


urlpatterns = [
    path('stationslists/', StationListAPI.as_view(), name='station_list'),
    path('hq-stations/', HQStationsAPI.as_view(), name='hq_stations_api'),
    path('parent-station/<int:parent_station_code>/detail/', ParentStationDetailAPI.as_view(), name='parent_station_detail_api'),
]
