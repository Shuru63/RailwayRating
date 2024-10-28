from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def allowed_users(allowed_user_types):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            if request.user.user_type.name in allowed_user_types:
                return view_func(request, *args, **kwargs)
            else:
                return Response({'detail': f"{request.user.user_type.name.upper()} doesn't have permission to view this page!"}, status=status.HTTP_403_FORBIDDEN)
        return wrapped_view
    return decorator

