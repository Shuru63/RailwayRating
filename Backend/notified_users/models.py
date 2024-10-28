from django.db import models

from notified_task.models import notified_task
from station.models import Station


class Post(models.Model):
    content = models.CharField(max_length=100)


    def __str__(self):
        return self.content


class notified_users(models.Model):
    username = models.CharField(max_length=100)
    whatsapp_number = models.CharField(max_length=15, null=True)
    mobile_number = models.CharField(max_length=15, null=True)
    email = models.EmailField(max_length=100, default=None, null=True)
    posts = models.ManyToManyField(Post, related_name='users')
    assigned_tasks = models.ManyToManyField(notified_task, related_name='assigned_tasks')
    assigned_station = models.ManyToManyField(Station, related_name='assigned_station')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200, default='')


    def __str__(self):
        return self.username
