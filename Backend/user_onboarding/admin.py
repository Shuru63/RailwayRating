from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from user_onboarding.models import RequestAccess, User, Assign_Permission, Post, Roles, RequestUser


class UserModelAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'user_type', 'enabled', 'first_name','middle_name', 'last_name', 'phone', 'station')
    list_filter = ('user_type',)
    fieldsets = (
        ('User Credentials', {
         'fields': ('username', 'email', 'phone', 'password')}),
        ('Personal info', {'fields': ('first_name',
         'middle_name', 'last_name', 'station')}),
        ('Permissions', {
         'fields': ('user_type', 'enabled', 'groups', 'user_permissions')}),
        ('Important dates', {'fields' : ('last_login',)}),
    )
    add_fieldsets = (

        (None, {
            'classes': ('wide',),
            'fields': ('username', 'user_type', 'enabled', 'password1', 'password2', 'email', 'phone', 'created_by', 'updated_by', 'railway_admin', 'staff', 'station'),
        }),
    )
    search_fields = ('phone',)
    ordering = ('phone', 'id')
    filter_horizontal = ()

    def has_permission(self, request):
        if request.user.is_superuser:
            return True
        return False


class RequestUserAdmin(admin.ModelAdmin):
    list_display = ('user_f_name', 'user_m_name', 'user_l_name', 'user_email',
                    'user_phone', 'user_type', 'user_station', 'user_posts', 'approved', 'seen')

    def get_fieldsets(self, request, obj=None):
        return (
            (None, {
                'fields': self.list_display,
            }),
        )

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False


class RequestAccessAdmin(admin.ModelAdmin):
    list_display = ('user_f_name', 'user_email',
                    'user_phone', 'user_station', 'access_requested', 'for_station', 'from_for_station', 'to_for_station', 'approved', 'seen')

    def get_fieldsets(self, request, obj=None):
        return (
            (None, {
                'fields': self.list_display,
            }),
        )

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False


admin.site.register(User, UserModelAdmin)
admin.site.register(Post)
admin.site.register(Roles)
admin.site.register(Assign_Permission)
admin.site.register(RequestUser, RequestUserAdmin)
admin.site.register(RequestAccess, RequestAccessAdmin)
