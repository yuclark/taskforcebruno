from rest_framework.permissions import BasePermission


class IsAuthenticatedUser(BasePermission):
    message = "Authentication credentials were not provided."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and getattr(user, "is_authenticated", False))


class IsMDCStaff(BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(
            user
            and getattr(user, "is_authenticated", False)
            and getattr(user, "is_staff", False)
        )
