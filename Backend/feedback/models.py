from django.db import models

from user_onboarding.models import User
from station.models import Station
from django.core.exceptions import ValidationError


class Feedback(models.Model):
    FEEDBACK_CHOICES = [
        ('2', 'Excellent'),
        ('1', 'OK'),
        ('0', 'Poor'),
    ]

    STATUS_CHOICES = [
        ('P', 'Pending'),
        ('C', 'Completed'),
    ]

    feedback_value_1 = models.CharField(max_length=1, choices=FEEDBACK_CHOICES, null=True, blank=True)
    feedback_value_2 = models.CharField(max_length=1, choices=FEEDBACK_CHOICES, null=True, blank=True)
    feedback_value_3 = models.CharField(max_length=1, choices=FEEDBACK_CHOICES, null=True, blank=True)
    feedback_value_4 = models.CharField(max_length=1, choices=FEEDBACK_CHOICES, null=True, blank=True)
    feedback_value_5 = models.CharField(max_length=1, choices=FEEDBACK_CHOICES, null=True, blank=True)
    passenger_name = models.CharField(max_length=100, default='')
    mobile_no = models.CharField(max_length=10, null=True, blank=True)
    ticket_no = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    verified = models.BooleanField(default=False) 
    date = models.DateField()
    time = models.TimeField(null=True)
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='P')
    updated_date_time = models.DateTimeField(null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_name = models.CharField(max_length=100, null=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)


    def clean(self):
        # Ensure that at least one feedback field has a value
        if not any(getattr(self, f"feedback_value_{i}") for i in range(1, 6)):
            raise ValidationError("At least one feedback field is required.")

    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.username
        super().save(*args, **kwargs)


    def __str__(self):
        if self.user:
            return  self.user.username
        else:
            return  self.user_name


class FeedbackSummaryVerification(models.Model):
    verified_summary_date = models.DateField(null=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    station=models.ForeignKey(Station,on_delete=models.CASCADE,default=1)
    email = models.EmailField(null=True)
    verified_at = models.DateTimeField(auto_now=True)
    verification_status= models.BooleanField(default=True) 
