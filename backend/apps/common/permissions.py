from rest_framework.permissions import BasePermission, SAFE_METHODS

def _role(request) -> str | None:
    user = request.user
    if not user or not user.is_authenticated:
        return None
    return getattr(user, 'role', None)

class IsAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return _role(request) == 'admin'

class IsSupportOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return _role(request) in {'support', 'admin'}

class IsArtistOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        role = _role(request)
        if role == 'admin':
            return True
        return role == 'artist' and hasattr(request.user, 'artist_profile')

class ReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return _role(request) == 'admin'

class IsOwnerOrAdmin(BasePermission):
    """Object-level ownership check; the view names the owner field."""

    def has_object_permission(self, request, view, obj) -> bool:
        if _role(request) is None:
            return False
        if _role(request) == 'admin':
            return True
        owner_field = getattr(view, 'owner_field', 'owner_id')
        return getattr(obj, owner_field, None) == request.user.id

class HasActiveSubscription(BasePermission):
    """Guards paid features; `plan_feature` on the view narrows it to one flag."""

    def has_permission(self, request, view) -> bool:
        role = _role(request)
        if role is None:
            return False
        if role == 'admin':
            return True
        if not request.user.subscription_active:
            return False
        feature = getattr(view, 'plan_feature', None)
        if not feature:
            return True
        plan = request.user.plan
        return bool(plan and getattr(plan, feature, False))
