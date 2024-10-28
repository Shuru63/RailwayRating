from django.contrib import admin

from .models import notified_users,Post


admin.site.register(notified_users)
admin.site.register(Post)
