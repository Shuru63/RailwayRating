from django.db import models

from user_onboarding.models import User
from station.models import Station
import os 
from cms.storage_backends import MediaStorage


class Inspection_feedback(models.Model):

    Rating_choices = [
        ('Excellent', 'Excellent'),
        ('OK', 'OK'),
        ('Poor', 'Poor'),
        ('NA', 'NA'),
    ]
    
    Status_choices = [
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
    ] 

    rating = models.CharField(max_length=10, choices=Rating_choices, default='NA')
    date=models.DateField(null=True)
    remarks = models.TextField()
    user=models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_name = models.CharField(max_length=100, null=True, default='')
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=Status_choices, default='Pending') 
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)
    images = models.ManyToManyField('Image', blank=True, related_name='feedback_images')


    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.username
        super().save(*args, **kwargs)


    def __str__(self):
        if self.user:
            return f'{self.rating}_{self.user.username}'
        else:
            return f"{self.rating}_{self.user_name}"


def get_upload_path(instance, filename):
        return f"images/inspection_feedback/{instance.inspection_feedback.user.station.station_name}/{filename}"


class Image(models.Model):
    inspection_feedback = models.ForeignKey(
        Inspection_feedback, related_name='feedback_images', on_delete=models.CASCADE
    )
    if os.getenv("ENV") == "LOCAL":
        image = models.ImageField(upload_to='inspection_feedback_images/')
    elif os.getenv("ENV") == "PROD":
        image = models.FileField(upload_to=get_upload_path, null=True, storage=MediaStorage())
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)

    def __str__(self):
        return f'{self.inspection_feedback}_{self.inspection_feedback.date}'
    
    def save(self, *args, **kwargs):
        if not self.pk and self.inspection_feedback.user:
            self.created_by = self.inspection_feedback.user.username
        super().save(*args, **kwargs)
