from django.db import models

# Create your models here.
from django.db import models
from shift.models import Shift
from task.models import Task
from django.utils import timezone


class TaskShiftOccurrence(models.Model):
    rating_required=models.BooleanField(null=True,default=True)
    occurrence_id=models.IntegerField(default=1)
    start_time=models.TimeField(default=timezone.now)
    end_time=models.TimeField(default=timezone.now)
    shift=models.ForeignKey(Shift,on_delete=models.CASCADE,null=True, related_name='occurrences')
    task=models.ForeignKey(Task,on_delete=models.CASCADE,null=True, related_name='occurrences')


    def __str__(self):
        return f"{self.id} {self.task} - {self.shift.shift_id} - {self.occurrence_id}"

    
