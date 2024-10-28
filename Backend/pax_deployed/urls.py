from django.urls import path

from .views import *


urlpatterns = [
    path('add/<str:date>/<int:shift_id>',PaxAPI.as_view(), name='add_pax'),
    path('fetch/<str:date>',FetchPaxAPI.as_view(), name='fetch_pax'),
    path('update/<int:pax_id>',PaxAPI.as_view(), name='update_pax_value')
]
