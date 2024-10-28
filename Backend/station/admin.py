from django.contrib import admin
from .models import Station


class StationModelAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]
    
    list_filter = ('station_category', 'is_active', 'is_hq', 'is_chi_sm')
    search_fields = ('station_name', 'station_name', 'station_id')
    ordering = ('station_name', 'station_id', 'station_category')


admin.site.register(Station, StationModelAdmin)