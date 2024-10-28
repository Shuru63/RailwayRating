from django.db import models

from user_onboarding.models import User
from shift.models import Shift


class Pax(models.Model):
    count=models.IntegerField(null=True)
    date=models.DateField()
    shift=models.ForeignKey(Shift,on_delete=models.CASCADE)
    user=models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_name = models.CharField(max_length=100, null=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, null=True, blank=True)
    STATUS_CHOICES = (("pending", "Pending"), ("submit", "Submit"))
    Pax_status= models.CharField(max_length=100, choices=STATUS_CHOICES, default="pending")


    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.username
        super().save(*args, **kwargs)
