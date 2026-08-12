from __future__ import annotations

from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel

class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'
    FAILED = 'failed', 'Failed'

class Payment(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments'
    )
    plan = models.ForeignKey('catalog.SubscriptionPlan', on_delete=models.PROTECT, related_name='payments')
    months = models.PositiveSmallIntegerField(default=1)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    authority = models.CharField(max_length=80, unique=True)
    ref_id = models.CharField(max_length=80, blank=True)
    gateway_message = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self) -> str:
        return f'{self.user_id}:{self.plan_id}:{self.status}'
