from __future__ import annotations

from django.conf import settings
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.notifications.models import NotificationType
from apps.notifications.services import notify
from .gateway import request_payment
from .models import Payment, PaymentStatus
from .serializers import PaymentCreateSerializer, PaymentSerializer, PaymentVerifySerializer

class PaymentViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('status',)

    def get_queryset(self):
        qs = Payment.objects.select_related('plan', 'user')
        if self.request.user.role == 'admin':
            return qs
        return qs.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def start(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.validated_data['plan']
        months = int(serializer.validated_data['months'])
        amount = plan.monthly_price * months
        authority, payment_url = request_payment(
            amount=amount,
            description=f'Trimir {plan.code} subscription for {months} month(s)',
            callback_url=f'{settings.FRONTEND_BASE_URL}/payment/callback',
        )
        payment = Payment.objects.create(
            user=request.user, plan=plan, months=months, amount=amount, authority=authority
        )
        return Response(
            {'payment': PaymentSerializer(payment).data, 'payment_url': payment_url},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'])
    def verify(self, request):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = self.get_queryset().filter(
            authority=serializer.validated_data['authority'], status=PaymentStatus.PENDING
        ).first()
        if not payment:
            return Response(
                {'detail': 'No pending payment for this authority.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if serializer.validated_data['status'].upper() != 'OK':
            payment.status = PaymentStatus.FAILED
            payment.gateway_message = 'Cancelled by the user.'
            payment.save(update_fields=['status', 'gateway_message'])
            return Response(PaymentSerializer(payment).data, status=status.HTTP_400_BAD_REQUEST)

        payment.status = PaymentStatus.PAID
        payment.ref_id = payment.authority[-10:]
        payment.gateway_message = 'Paid in the sandbox gateway.'
        payment.save(update_fields=['status', 'ref_id', 'gateway_message'])
        payment.user.extend_subscription(payment.months, tier=payment.plan.code)
        notify(
            payment.user,
            NotificationType.SUBSCRIPTION_EXPIRY,
            'اشتراک شما فعال شد',
            f'اشتراک {payment.plan.name} برای {payment.months} ماه فعال شد.',
            '/settings',
        )
        return Response(PaymentSerializer(payment).data)
