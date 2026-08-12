from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from .models import Ticket, TicketStatus

class TicketAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='listener@example.com', password='password12345', display_name='Listener'
        )
        self.other = User.objects.create_user(
            email='other@example.com', password='password12345', display_name='Other'
        )
        self.support = User.objects.create_user(
            email='support@example.com',
            password='password12345',
            display_name='Support',
            role='support',
        )

    def _open_ticket(self) -> Ticket:
        self.client.force_authenticate(self.user)
        self.client.post(
            reverse('ticket-list'), {'subject': 'Payment issue', 'body': 'Help'}, format='json'
        )
        return Ticket.objects.get(subject='Payment issue')

    def test_user_opens_a_ticket_and_staff_is_notified(self):
        ticket = self._open_ticket()
        self.assertEqual(ticket.messages.count(), 1)
        self.assertTrue(self.support.notifications.filter(type='new_ticket').exists())

    def test_users_only_see_their_own_tickets(self):
        self._open_ticket()
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(reverse('ticket-list')).data['count'], 0)
        self.client.force_authenticate(self.support)
        self.assertEqual(self.client.get(reverse('ticket-list')).data['count'], 1)

    def test_support_replies_and_the_status_changes(self):
        ticket = self._open_ticket()
        self.client.force_authenticate(self.support)
        response = self.client.post(
            reverse('ticket-reply', args=[ticket.id]), {'body': 'On it'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.REPLIED)
        self.assertTrue(self.user.notifications.exists())

    def test_a_user_cannot_reply_as_support(self):
        ticket = self._open_ticket()
        response = self.client.post(
            reverse('ticket-reply', args=[ticket.id]), {'body': 'Me again'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_support_closes_a_ticket(self):
        ticket = self._open_ticket()
        self.client.force_authenticate(self.support)
        self.client.post(reverse('ticket-close', args=[ticket.id]))
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.CLOSED)
