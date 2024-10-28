from django.db import models

from user_onboarding.models import User
from task_shift_occurrence.models import TaskShiftOccurrence


class Rating(models.Model):
    rating_value = models.CharField(null=True,max_length=200)
    date=models.DateField()
    task_shift_occur_id = models.ForeignKey(
        TaskShiftOccurrence, on_delete=models.CASCADE, related_name='ratings')
    user=models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_name = models.CharField(max_length=100, null=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)
    STATUS_CHOICES = (("pending", "Pending"), ("completed", "Completed"))
    task_status= models.CharField(max_length=100, choices=STATUS_CHOICES, default="pending")


    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.username
        super().save(*args, **kwargs)


    def __str__(self):
        if self.user:
            return  f"{self.user.station.station_name}/{self.date}/{self.task_shift_occur_id.shift.shift_id}/{self.task_shift_occur_id.task.task_id}/{self.task_shift_occur_id.occurrence_id}"
        else:
            return  f"{self.task_shift_occur_id.task.station.station_name}/{self.date}/{self.task_shift_occur_id.shift.shift_id}/{self.task_shift_occur_id.task.task_id}/{self.task_shift_occur_id.occurrence_id}"


class TaskShiftOccurUser(models.Model):
    task_shift_occur_id = models.ForeignKey(
        TaskShiftOccurrence, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    user_name = models.CharField(max_length=100, null=True, default='')
    updated_at_times = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.user_name} ({self.task_shift_occur_id})"
    