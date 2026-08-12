from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.common.permissions import IsSupportOrAdmin
from apps.notifications.models import NotificationType
from apps.notifications.services import notify, notify_staff
from .models import SenderRole, Ticket, TicketMessage, TicketStatus
from .serializers import TicketCreateSerializer, TicketSerializer

class TicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']
    filterset_fields = ('status',)
    search_fields = ('subject', 'user__display_name')
    owner_field = 'user_id'

    def get_queryset(self):
        qs = Ticket.objects.select_related('user').prefetch_related('messages')
        if self.request.user.role in {'support', 'admin'}:
            return qs
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        return TicketCreateSerializer if self.action == 'create' else TicketSerializer

    def get_permissions(self):
        if self.action in {'reply', 'close'}:
            return [IsAuthenticated(), IsSupportOrAdmin()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = Ticket.objects.create(
            user=request.user, subject=serializer.validated_data['subject']
        )
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_role=SenderRole.USER,
            sender_name=request.user.display_name,
            body=serializer.validated_data['body'],
        )
        notify_staff(
            NotificationType.NEW_TICKET,
            'تیکت پشتیبانی جدید',
            f'کاربر «{request.user.display_name}» تیکت تازه‌ای باز کرد.',
            '/dashboard',
        )
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        body = (request.data.get('body') or '').strip()
        if not body:
            return Response({'body': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_role=SenderRole.SUPPORT,
            sender_name=request.user.display_name,
            body=body,
        )
        if ticket.status != TicketStatus.CLOSED:
            ticket.status = TicketStatus.REPLIED
        ticket.save(update_fields=['status', 'updated_at'])
        notify(
            ticket.user,
            NotificationType.NEW_TICKET,
            'پاسخ پشتیبانی',
            f'به تیکت «{ticket.subject}» پاسخ داده شد.',
        )
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = TicketStatus.CLOSED
        ticket.save(update_fields=['status', 'updated_at'])
        return Response(TicketSerializer(ticket).data)
