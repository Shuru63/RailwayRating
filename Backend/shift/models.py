from django.db import models

from station.models import Station
from user_onboarding.models import User


class Shift(models.Model):
    shift_id=models.IntegerField(null=True,blank=True, default=1)
    start_time = models.TimeField()
    end_time = models.TimeField()
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)


class Verified_shift(models.Model):
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE)
    verified_shift_date = models.DateField(null=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    verified_email = models.CharField(max_length=200)
    verified_at = models.DateTimeField(auto_now=True)
    verification_status= models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, default='')
