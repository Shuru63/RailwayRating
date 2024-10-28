from django.http import HttpResponse, HttpResponseForbidden
from django_ratelimit.exceptions import Ratelimited


def handler403(request, exception=None):
    if isinstance(exception, Ratelimited):
        return HttpResponse('<h1>Sorry, too many attempts!!<h1>', status=429)
    return HttpResponseForbidden('<h1>403 error: Permission denied.<h1>')
