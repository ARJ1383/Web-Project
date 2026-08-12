from __future__ import annotations

from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel

class NotificationType(models.TextChoices):
    SUBSCRIPTION_EXPIRY = 'subscription_expiry', 'Subscription expiry'
    NEW_RELEASE = 'new_release', 'New release'
    VERIFICATION_RESULT = 'verification_result', 'Verification result'
    MONTHLY_PAYOUT = 'monthly_payout', 'Monthly payout'
    NEW_TICKET = 'new_ticket', 'New ticket'
    NEW_VERIFICATION_REQUEST = 'new_verification_request', 'New verification request'

class Notification(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    type = models.CharField(max_length=40, choices=NotificationType.choices)
    title = models.CharField(max_length=160)
    body = models.TextField(blank=True)
    link = models.CharField(max_length=200, blank=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self) -> str:
        return f'{self.user_id}:{self.title}'
