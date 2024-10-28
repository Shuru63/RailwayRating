from django.urls import path
from analytics import views

urlpatterns = [
    path('graph-1/', views.analytics, name='analytics'),
]