from django.urls import path

from .views import (
    complain, 
    NotifiedFeedbackAPI,
    ComplaintsListAPIView,
    ComplaintDetailUpdateDeleteAPIView
    )


urlpatterns = [
    path('complain', complain,name='complain'),
    path('data/<int:notified_task_id>', NotifiedFeedbackAPI.as_view(), name='send_feedback_msg'),
    path('all/<str:date>/', ComplaintsListAPIView.as_view(), name='complaints_list'),
    path('complaint/<int:complaint_id>/', ComplaintDetailUpdateDeleteAPIView.as_view(), name='complaint_retrieve_update_delete')
]
