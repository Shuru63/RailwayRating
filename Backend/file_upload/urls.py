from django.urls import path

from .views import (
    MediaAPIView, 
    CheckImageExistsAPIView, 
    view_media, 
    NotifiedDataMediaAPIView
    )


urlpatterns = [
    path('get/<int:task_id>/<int:shift_id>/<int:occurrence_id>', MediaAPIView.as_view(), name='get_media'),
    path('add/<int:task_id>/<int:shift_id>/<int:occurrence_id>', MediaAPIView.as_view(), name='add_media'),
    path('update/<int:img_id>', MediaAPIView.as_view(), name='update_media'),
    path('delete/<int:img_id>', MediaAPIView.as_view(), name='delete_media'),
    path('check_image_exists', CheckImageExistsAPIView.as_view(), name='check_image_exists'),
    path('view/<int:img_id>/<int:task_id>/<int:shift_id>/<int:occur_id>/<str:prev_page>', view_media, name='view_media'),

    path('get/notified-data/<int:complaint_id>/', NotifiedDataMediaAPIView.as_view(), name='get_notified_data_media'),
    path('update/notified-data/<int:img_id>/', NotifiedDataMediaAPIView.as_view(), name='update_notified_data_media'),
    path('delete/notified-data/<int:img_id>/', NotifiedDataMediaAPIView.as_view(), name='delete_notified_data_media')
]
