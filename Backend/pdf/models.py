from django.db import models

from station.models import Station
from user_onboarding.models import User


class DailyEvaluationVerification(models.Model):
    verified_eval_date = models.DateField(null=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    station=models.ForeignKey(Station, on_delete=models.CASCADE, default=1)
    email = models.EmailField(null=True)
    verified_at = models.DateTimeField(auto_now=True)
    verification_status= models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, default='')
