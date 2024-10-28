import os
from django.db import models
from io import BytesIO
from PIL import Image
from django.core.files import File
from django.forms import ValidationError
from cms.storage_backends import MediaStorage

from user_onboarding.models import User
from task_shift_occurrence.models import TaskShiftOccurrence
from notified_data.models import notified_data


def compress(image):
    im = Image.open(image)
    im = im.convert("RGB")
    im_io = BytesIO()
    im.save(im_io, "JPEG", quality=40)
    new_image = File(im_io, name=image.name)
    return new_image


def get_upload_path(instance, filename):
    if instance.feedback_complaint is not None:
        return f"images/complaints/{instance.user.station.station_name}/{filename}"
    else:
        return f"images/{instance.user.station.station_name}/{filename}"


class Media(models.Model):
    date = models.DateField(null=True)
    if os.getenv("ENV") == "LOCAL":
        image = models.ImageField(upload_to=get_upload_path, null=True)
    elif os.getenv("ENV") == "PROD":
        image = models.FileField(
            upload_to=get_upload_path, null=True, storage=MediaStorage())
    task_shift_occur_id = models.ForeignKey(
        TaskShiftOccurrence, on_delete=models.CASCADE, null=True, related_name='images')
    feedback_complaint = models.ForeignKey(
        notified_data, related_name='images', on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_name = models.CharField(max_length=100, null=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)
    latitude = models.CharField(max_length=20, null=True, default="")
    longitude = models.CharField(max_length=20, null=True, default="")


    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.username
        if self.task_shift_occur_id is not None and self.feedback_complaint is not None:
            raise ValidationError("A Media instance cannot have both a task_shift_occur_id and a notified_data.")
        super().save(*args, **kwargs)


    def __str__(self):
        if self.user:
            return  f"{self.user.station.station_name}/{self.date}/{self.task_shift_occur_id.shift.shift_id}/{self.task_shift_occur_id.task.task_id}/{self.task_shift_occur_id.occurrence_id}/{self.user.username}"
        else:
            return  f"{self.task_shift_occur_id.task.station.station_name}/{self.date}/{self.task_shift_occur_id.shift.shift_id}/{self.task_shift_occur_id.task.task_id}/{self.task_shift_occur_id.occurrence_id}/{self.user_name}"
        
