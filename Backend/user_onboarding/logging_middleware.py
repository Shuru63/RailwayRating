import logging
import time
import json
from datetime import datetime
from django.urls import resolve
from django.contrib.auth import get_user
from rest_framework_simplejwt.authentication import JWTAuthentication


logger = logging.getLogger(__name__)


class LoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            user, _ = JWTAuthentication().authenticate(request)
            if user:
                request.user = user
            else:
                request.user = get_user(request)
        except Exception as e:
            pass
        
        # Log the start of the request
        start_time = time.time()
        log_data = {
            "event": "Request Start",
            "method": request.method,
            "path": request.path,
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time)),
        }

        # Set username based on authentication status
        if request.user.is_authenticated:
            log_data["username"] = request.user.username
            # Add station_code to log_data
            if hasattr(request.user, 'station') and request.user.station:
                log_data["station_code"] = request.user.station.station_name
                log_data["station_ID"] = request.user.station.station_code
            # Add phone number to log_data
            log_data["phone"] = request.user.phone if hasattr(request.user, 'phone') else None
        else:
            log_data["username"] = "Anonymous"

        logger.info(json.dumps(log_data))

        response = self.get_response(request)

        # Log the end of the request
        end_time = time.time()
        duration = end_time - start_time
        log_data["event"] = "Request End"
        log_data["status_code"] = response.status_code
        log_data["duration"] = f"{duration:.2f}s"
        log_data["timestamp"] = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(end_time))

        try:
            # Resolve the view function name
            match = resolve(request.path_info)
            if hasattr(match.func, 'view_class'):
                log_data["view_function"] = match.func.view_class.__name__
            else:
                log_data["view_function"] = match.func.__name__
        except AttributeError:
            # If any attribute is missing, log as "Unknown"
            pass

        logger.info(json.dumps(log_data))

        return response