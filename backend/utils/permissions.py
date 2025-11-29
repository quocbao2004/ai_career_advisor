from rest_framework import status
from rest_framework.permissions import BasePermission
import functools
from rest_framework.response import Response

class IsUser(BasePermission):
    def has_permission_admin(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')
    def has_permission_user(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'user')
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.role == 'user'))

def admin_required(view_func):
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({
                "message": "Cần đăng nhập trước"
            }, status=status.HTTP_401_UNAUTHORIZED)
        elif not request.user.role == 'admin':
            return Response({
                "message": "Bạn không được cấp quyền cho công việc này!"
            }, status=status.HTTP_403_FORBIDDEN)
        return view_func(request, *args, **kwargs)
    return wrapper