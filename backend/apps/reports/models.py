from __future__ import annotations

from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel

class PayoutStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    SETTLED = 'settled', 'Settled'

class Payout(TimeStampedModel):
    """One month of aggregated earnings for an artist (the audit table)."""

    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payouts'
    )
    month = models.CharField(max_length=7)
    unique_listeners = models.PositiveIntegerField(default=0)
    monthly_streams = models.PositiveIntegerField(default=0)
    reward_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(
        max_length=10, choices=PayoutStatus.choices, default=PayoutStatus.PENDING
    )
    settled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('artist', 'month')
        ordering = ('-month', '-reward_amount')

    def __str__(self) -> str:
        return f'{self.artist_id}:{self.month}'
