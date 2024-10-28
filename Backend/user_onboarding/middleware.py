from django.http import JsonResponse
from django.urls import reverse


class AdminSuperuserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and not request.user.is_superuser and request.path.startswith(reverse('admin:index')):
            return JsonResponse({"error": "Forbidden"}, status=403)
        return self.get_response(request)
