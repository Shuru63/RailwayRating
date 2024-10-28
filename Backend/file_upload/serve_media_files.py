from mimetypes import guess_type
from django.http import HttpResponse
from django.conf import settings
import os


def serve_file(request, file_path):
    BASE_DIR = settings.BASE_DIR
    full_path = os.path.join(BASE_DIR, "media", file_path)
    if os.path.exists(full_path):
        with open(full_path, 'rb') as f:
            content = f.read()
        content_type = guess_type(full_path)[0]
        return HttpResponse(content, content_type=content_type)
    else:
        return HttpResponse(status=404)
