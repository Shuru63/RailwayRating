from django.contrib import admin
from operator import and_
from django.db.models import Q
from functools import reduce

from .models import Rating, TaskShiftOccurUser


class RatingModelAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]
    
    list_filter = ('date', 'user__station__station_name')
    search_fields = ('date', 'rating_value', 'user_name', 'task_status', 'task_shift_occur_id__task__task_description', 'user__station__station_name')



    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        search_words = search_term.split()
        if search_words:
            q_objects = [Q(**{field + '__icontains': word})
                        for field in self.search_fields
                        for word in search_words]
            queryset |= self.model.objects.filter(reduce(and_, q_objects))
        return queryset, use_distinct


admin.site.register(Rating, RatingModelAdmin)
admin.site.register(TaskShiftOccurUser)