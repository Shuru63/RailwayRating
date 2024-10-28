from django.db import models

from django.shortcuts import get_object_or_404


class Station(models.Model):
    station_name = models.CharField(max_length=100)
    station_id = models.IntegerField(null=True)
    station_code = models.IntegerField()
    chi_id = models.IntegerField()
    station_zone = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    station_penalty = models.FloatField(null=True, default=0.0)
    name_of_work = models.CharField(max_length=500, default='')
    contract_by = models.CharField(max_length=300, default='')
    contract_no = models.CharField(max_length=100, default='')
    station_category = models.CharField(max_length=5, null=True)
    is_hq = models.BooleanField(default=False)
    is_chi_sm = models.BooleanField(default=False)
    parent_station = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)


    @classmethod
    def get_station_obj(cls, station_id):
        return get_object_or_404(cls, id=station_id)
    
    
    def __str__(self):
        return self.station_name
    

class Access_Station (models.Model):
    access_stations=models.CharField(max_length=1000, null=True, blank=True)
    user_name=models.CharField(max_length=100, unique=True)
    
    
    def __str__(self):
        return self.access_stations