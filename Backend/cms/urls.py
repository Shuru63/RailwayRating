"""
URL configuration for cms project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static


urlpatterns = [
    path("AapKaBaap/", admin.site.urls),
    path('', include('website.urls')),
    path('user/', include('user_onboarding.urls')),
    path('ratings/', include('ratings.urls')),
    path('api/comment/', include('comment.urls')),
    path('api/pax/', include('pax_deployed.urls')),
    path('api/media/', include('file_upload.urls')),
    path('api/feedback/', include('feedback.urls')),
    path('api/inspection-feedback/', include('inspection_feedback.urls')),
    path('complain/', include('notified_data.urls')),
    path('api/analytics/',include('analytics.urls')),
    path('pdf/', include('pdf.urls')),
    path('station/', include('station.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler403 = 'cms.views.handler403'
