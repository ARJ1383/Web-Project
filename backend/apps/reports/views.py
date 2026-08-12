from __future__ import annotations

from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.models import User
from apps.common.permissions import IsAdmin, IsSupportOrAdmin
from apps.notifications.models import NotificationType
from apps.notifications.services import notify
from .models import Payout, PayoutStatus
from .serializers import PayoutSerializer
from .services import admin_overview, artist_report, build_payouts, current_month

class ArtistReportAPIView(APIView):
    """Artists read their own report; support and admins may pass ?artist=<id>."""

    def get(self, request):
        artist_id = request.query_params.get('artist')
        if artist_id and request.user.role in {'support', 'admin'}:
            artist = User.objects.filter(id=artist_id).first()
            if not artist:
                return Response(
                    {'detail': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            artist = request.user
        return Response(artist_report(artist, request.query_params.get('month')))

class AdminOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated, IsSupportOrAdmin]

    def get(self, request):
        return Response(admin_overview())

class PayoutViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        month = self.request.query_params.get('month') or current_month()
        return Payout.objects.select_related('artist').filter(month=month)

    def list(self, request, *args, **kwargs):
        """Refreshes the month's rows from the play events, then returns them."""
        build_payouts(request.query_params.get('month') or current_month())
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def settle(self, request, pk=None):
        payout = self.get_object()
        if payout.status == PayoutStatus.SETTLED:
            return Response(self.get_serializer(payout).data)
        payout.status = PayoutStatus.SETTLED
        payout.settled_at = timezone.now()
        payout.save(update_fields=['status', 'settled_at'])
        notify(
            payout.artist,
            NotificationType.MONTHLY_PAYOUT,
            'محاسبات مالی ماهانه',
            f'پاداش ماه {payout.month} شما تسویه شد.',
        )
        return Response(self.get_serializer(payout).data)
