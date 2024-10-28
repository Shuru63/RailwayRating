from django.db import models

from notified_task.models import notified_task
from user_onboarding.models import User


class notified_data(models.Model):
    task = models.ForeignKey(notified_task, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    complaint_date = models.DateField(null=True)
    feedback = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_name = models.CharField(max_length=100, null=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, default='')
    latitude = models.CharField(max_length=20, null=True, default='')
    longitude = models.CharField(max_length=20, null=True, default='')


    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.username
        super().save(*args, **kwargs)
