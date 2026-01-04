from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Chỉ cho phép Admin truy cập
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin')

class IsAdminOrUser(BasePermission):
    """
    Cho phép cả Admin và User (nhưng phải đăng nhập)
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)