from django.urls import path

from .views import CommentAPI


urlpatterns = [
    path('add/<str:date>/<int:task_id>/<int:shift_id>/<int:occurrence_id>', CommentAPI.as_view(), name='add_comment'),
    path('get/<str:date>/<int:task_id>/<int:shift_id>/<int:occurrence_id>', CommentAPI.as_view(), name='get_comment'),
    path('update/<int:comment_id>', CommentAPI.as_view(), name='update_comment'),
    path('delete/<int:comment_id>', CommentAPI.as_view(), name='delete_comment'),
]