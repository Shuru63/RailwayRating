from django.urls import path

from .views import inspection_feedback, InspectionFeedbackApi,UpdateFeedbackStatusApi,ListRetrieveUpdateDeleteFeedbackApi, ListFeedbacksByDateApi,get_inspection_feedback_images,delete_inspection_feedback_image_api



urlpatterns = [
    path('enter/', inspection_feedback, name='inspection_feedback'),
    path('add/', InspectionFeedbackApi.as_view(), name='add_inspection_feedback'),
    path('update-feedback-status/<int:pk>/', UpdateFeedbackStatusApi.as_view(), name='update_feedback_status_api'),
    
    path('feedbacks/', ListFeedbacksByDateApi.as_view(), name='list_feedbacks_by_date_api'),
    path('feedback/<int:pk>/', ListRetrieveUpdateDeleteFeedbackApi.as_view(), name='feedback_api'),

    
    path('<int:feedback_id>/images/', get_inspection_feedback_images, name='get_inspection_feedback_images'),
    path('<int:feedback_id>/images/<int:image_id>/', delete_inspection_feedback_image_api, name='delete_inspection_feedback_image'),
]
