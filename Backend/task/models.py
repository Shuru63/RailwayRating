from django.db import models
import datetime

from station.models import Station


class Task(models.Model):
    TASK_TYPE_CHOICES = (
        ('D', 'Daily'),
        ('A', 'Alternately'),
        ('W', 'Weekly'),
        ('F', 'Fortnightly'),
        ('B', 'Biannually'),
        ('H', 'Half Yearly'),
        ('Q', 'Quaterly'),
        ('BW', 'Biweekly'),
        ('M', 'Monthly'),
        ('Y', 'Yearly')
    )

    WEEKDAY_CHOICES = [
        ('0', 'Monday'),
        ('1', 'Tuesday'),
        ('2', 'Wednesday'),
        ('3', 'Thursday'),
        ('4', 'Friday'),
        ('5', 'Saturday'),
        ('6', 'Sunday'),
    ]

    task_id = models.IntegerField(null=True, default=1)
    task_description = models.TextField()
    service_type = models.CharField(max_length=200)
    cleaning_cycle_days = models.IntegerField()  # frequesncy per 2 years
    cleaning_cycle_type = models.CharField(
        max_length=100, choices=TASK_TYPE_CHOICES, default='D')
    cleaning_cycle_day_freq = models.IntegerField()
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)
    task_type = models.CharField(max_length=5, default='A')
    weekday = models.CharField(
        max_length=100, choices=WEEKDAY_CHOICES, blank=True, null=True, default='0')
    biweekday = models.CharField(
        max_length=100, choices=WEEKDAY_CHOICES, blank=True, null=True, default='5')
    alternate_day_start = models.DateField(
        blank=True, null=True, default=datetime.date(2023, 1, 1))
    biannually_date1 = models.DateField(
        blank=True, null=True, default=datetime.date.today)
    biannually_date2 = models.DateField(
        blank=True, null=True, default=datetime.date.today)

    def __str__(self):
        return self.task_description


class CycleDate(models.Model):
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='cycles')
    cycle_type = models.CharField(max_length=200)
    cycle = models.DateField(null=True)
    next_cycle = models.DateField(null=True)
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.station.station_name} - {self.task.task_description} - {self.cycle}"
