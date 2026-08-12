from __future__ import annotations

from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel

class TicketStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    REPLIED = 'replied', 'Replied'
    CLOSED = 'closed', 'Closed'

class SenderRole(models.TextChoices):
    USER = 'user', 'User'
    SUPPORT = 'support', 'Support'

class Ticket(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets'
    )
    subject = models.CharField(max_length=160)
    status = models.CharField(max_length=10, choices=TicketStatus.choices, default=TicketStatus.OPEN)

    class Meta:
        ordering = ('-updated_at',)

    def __str__(self) -> str:
        return self.subject

class TicketMessage(TimeStampedModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='ticket_messages'
    )
    sender_role = models.CharField(max_length=10, choices=SenderRole.choices)
    sender_name = models.CharField(max_length=120)
    body = models.TextField()

    class Meta:
        ordering = ('created_at',)

    def __str__(self) -> str:
        return f'{self.ticket_id}:{self.sender_role}'
