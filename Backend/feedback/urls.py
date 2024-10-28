from django.urls import path

from .views import (
    passenger_feedback, 
    verify_passenger_email, 
    confirm_passenger_email, 
    FeedbackAPI, 
    FeedbackListAPI,
    DeleteFeedbackAPI, 
    FeedbackDetailUpdateAPI,
    UpdateFeedbackStatusAPI
    )


urlpatterns = [
    path('enter/', passenger_feedback, name='passenger_feedback'),
    path('verify-passenger-email/', verify_passenger_email, name='verify_passenger_email'),
    path('confirm-passenger-email/', confirm_passenger_email, name='confirm_passenger_email'),
    path('add/<int:station_code>', FeedbackAPI.as_view(), name='add_feedback'),
    path('all/<str:date>/', FeedbackListAPI.as_view(), name='list_feedback'),
    path('update/<int:feedback_id>/', FeedbackDetailUpdateAPI.as_view(), name='retrieve_update_feedback'),
    path('status/<int:feedback_id>/', UpdateFeedbackStatusAPI.as_view(), name='update_feedback_status'),
    path('delete/<int:feedback_id>', DeleteFeedbackAPI.as_view(), name='delete_feedback'),
]
