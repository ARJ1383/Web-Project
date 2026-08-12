from __future__ import annotations

from apps.accounts.models import RoleChoices, User
from .models import Notification

def notify(user, type: str, title: str, body: str = '', link: str = '') -> Notification:
    """Creates a notification and trims the user's list to their own limit."""
    notification = Notification.objects.create(
        user=user, type=type, title=title, body=body, link=link
    )
    keep = user.notification_limit
    extra = Notification.objects.filter(user=user).values_list('id', flat=True)[keep:]
    if extra:
        Notification.objects.filter(id__in=list(extra)).delete()
    return notification

def notify_staff(type: str, title: str, body: str = '', link: str = '') -> None:
    staff = User.objects.filter(role__in=[RoleChoices.SUPPORT, RoleChoices.ADMIN])
    for member in staff:
        notify(member, type, title, body, link)
