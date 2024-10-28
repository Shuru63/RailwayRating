from django.contrib import admin

from .models import Task, CycleDate


class TaskModelAdmin(admin.ModelAdmin):
    list_filter = ('station__station_name', 'cleaning_cycle_type')
    search_fields = ('station__station_name', 'task_description')


admin.site.register(Task, TaskModelAdmin)
admin.site.register(CycleDate)
