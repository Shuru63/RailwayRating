from django.contrib import admin
from operator import and_
from django.db.models import Q
from functools import reduce

from .models import Media


class MediaModelAdmin(admin.ModelAdmin):
    search_fields = ('date', 'user_name', 'task_shift_occur_id__occurrence_id',  'task_shift_occur_id__task__task_description', 'task_shift_occur_id__task__task_id', 'task_shift_occur_id__shift__shift_id', 'user__station__station_name')


    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        search_words = search_term.split()
        if search_words:
            q_objects = [Q(**{field + '__icontains': word})
                        for field in self.search_fields
                        for word in search_words]
            queryset |= self.model.objects.filter(reduce(and_, q_objects))
        return queryset, use_distinct


admin.site.register(Media, MediaModelAdmin)
