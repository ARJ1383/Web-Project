from __future__ import annotations

from django.conf import settings
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.notifications.models import NotificationType
from apps.notifications.services import notify
from .gateway import GatewayError, request_payment, verify_payment
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

        try:
            authority, payment_url = request_payment(
                amount=amount,
                description=f'Trimir {plan.code} subscription for {months} month(s)',
                callback_url=f'{settings.FRONTEND_BASE_URL}/payment/callback',
            )
        except GatewayError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

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

        callback_status = serializer.validated_data['status'].upper()
        if callback_status != 'OK':
            payment.status = PaymentStatus.FAILED
            payment.gateway_message = 'Cancelled by the user.'
            payment.save(update_fields=['status', 'gateway_message'])
            return Response(PaymentSerializer(payment).data, status=status.HTTP_400_BAD_REQUEST)

        try:
            ref_id, gateway_message = verify_payment(
                amount=payment.amount,
                authority=payment.authority,
            )
        except GatewayError as exc:
            payment.gateway_message = str(exc)
            payment.save(update_fields=['gateway_message'])
            return Response(
                {'detail': str(exc), 'payment': PaymentSerializer(payment).data},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment.status = PaymentStatus.PAID
        payment.ref_id = ref_id
        payment.gateway_message = gateway_message
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
