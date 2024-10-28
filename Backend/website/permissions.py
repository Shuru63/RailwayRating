from rest_framework.permissions import BasePermission


class IsRailwayAdmin(BasePermission):
    message = 'Access is restricted to  Railway Admins only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.user_type.role.name.lower() == 'railway admin'
