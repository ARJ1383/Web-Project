from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.utils import timezone

class HasActiveSubscription(BasePermission):

    def has_permission(self, request, view):

        if request.user.role == "admin":
            return True

        if not request.user.subscription_expires_at:
            return False

        return request.user.subscription_expires_at > timezone.now()
    
class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        if request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin':
            return True
        owner_id = getattr(obj, 'owner_id', None)
        if owner_id is None:
            owner_id = getattr(obj, 'user_id', None)
        return request.user and request.user.is_authenticated and owner_id == request.user.id

class IsSelfOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        if request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin':
            return True
        return request.user and request.user.is_authenticated and getattr(obj, 'id', None) == request.user.id

class IsArtistOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'role', None) == 'admin':
            return True
        return getattr(request.user, 'role', None) == 'artist' and hasattr(request.user, 'artist_profile')

class ReadOnlyOrAuthenticated(BasePermission):
    def has_permission(self, request, view) -> bool:
        return request.method in SAFE_METHODS or (request.user and request.user.is_authenticated)
