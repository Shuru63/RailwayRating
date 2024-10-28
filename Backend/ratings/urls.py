from django.urls import path

from .views.funcs import enable_task, prev_page_url, task_description
from .views.pages import rating_details, curr_shift, add_rating
from .views.api import (
    CreateRatingAPIView, 
    UpdateRatingAPIView, 
    TaskStatusUpdateAPIView,
    get_occurrence_image_status,
    )
from .views.auth import (
    verify_signature_email, 
    confirm_signature_email, 
    confirm_signature_email_feedback_summary, 
    confirm_signature_email_daily_eval
    )


urlpatterns = [
    path('enable-tasks/', enable_task, name='enable_task'),
    path('prev-page-url/', prev_page_url, name='prev_page_url'),
    path('taskDescription/', task_description, name='task_description'),

    path('all/', rating_details, name='rating_details'),
    path('currShift', curr_shift, name='curr_shift'),
    path('addRating/<str:date>/<int:task_id>/<int:shift_id>/<int:occurrence_id>',add_rating,name='add_rating'),

    path('api/add/<int:task_id>/<int:shift_id>/<int:occurrence_id>', CreateRatingAPIView.as_view(), name='create_rating'),
    path('api/get/<int:task_id>/<int:shift_id>/<int:occurrence_id>', CreateRatingAPIView.as_view(), name='get_rating'),
    path('api/update/<int:rating_id>', UpdateRatingAPIView.as_view(), name='update_rating'),
    path('api/update-status/<int:task_id>/<int:shift_id>/<int:occurrence_id>', TaskStatusUpdateAPIView.as_view(), name='update_rating_status'),

    path('verify_signature_email', verify_signature_email, name='verify_signature_email'),
    path('confirm_signature_email', confirm_signature_email, name='confirm_signature_email'),
    path('confirm_signature_email_feedback_summary', confirm_signature_email_feedback_summary, name='confirm_signature_email_feedback_summary'),
    path('confirm_signature_email_daily_eval', confirm_signature_email_daily_eval, name="confirm_signature_email_daily_eval"),
    path('get_occurrence_image_status/', get_occurrence_image_status, name='get_occurrence_image_status'),
]