from django.db import models
from user_onboarding.models import User
from task_shift_occurrence.models import TaskShiftOccurrence


class Comment(models.Model):
    date=models.DateField(null=True)
    text = models.TextField()
    task_shift_occur_id = models.ForeignKey(
        TaskShiftOccurrence, on_delete=models.CASCADE)
    user=models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_name = models.CharField(max_length=100, null=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)


    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.username
        super().save(*args, **kwargs)


    def __str__(self):
        if self.user:
            return  f"{self.text}_{self.user.username}"
        else:
            return  f"{self.text}_{self.user_name}"