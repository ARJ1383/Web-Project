from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from .models import Notification, NotificationType
from .services import notify

class NotificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='listener@example.com', password='password12345', display_name='Listener'
        )
        self.other = User.objects.create_user(
            email='other@example.com', password='password12345', display_name='Other'
        )
        notify(self.user, NotificationType.NEW_RELEASE, 'A new song')
        notify(self.other, NotificationType.NEW_RELEASE, 'Not yours')
        self.client.force_authenticate(self.user)

    def test_only_own_notifications_are_listed(self):
        titles = [row['title'] for row in self.client.get(reverse('notification-list')).data['results']]
        self.assertEqual(titles, ['A new song'])

    def test_mark_all_read(self):
        self.client.post(reverse('notification-mark-all-read'))
        self.assertFalse(Notification.objects.filter(user=self.user, read=False).exists())
        self.assertTrue(Notification.objects.filter(user=self.other, read=False).exists())

    def test_notifications_are_trimmed_to_the_user_limit(self):
        self.user.notification_limit = 3
        self.user.save(update_fields=['notification_limit'])
        for index in range(5):
            notify(self.user, NotificationType.NEW_RELEASE, f'Song {index}')
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 3)

    def test_a_notification_can_be_deleted(self):
        notification = Notification.objects.get(user=self.user)
        response = self.client.delete(reverse('notification-detail', args=[notification.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
