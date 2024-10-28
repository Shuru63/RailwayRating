from django.db import models


class notified_task(models.Model):
    task_id=models.IntegerField(default=1)
    task_description=models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)


    def __str__(self):
        return self.task_description
    
