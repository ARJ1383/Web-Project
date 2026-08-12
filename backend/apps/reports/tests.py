from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import ArtistProfile, User
from apps.catalog.models import PlayEvent, Song, SubscriptionPlan
from .models import Payout, PayoutStatus

class ReportsAPITests(APITestCase):
    def setUp(self):
        SubscriptionPlan.objects.create(code='basic', name='Basic', monthly_price=0, sort_order=1)
        SubscriptionPlan.objects.create(
            code='gold', name='Gold', monthly_price=200000, currency='تومان', sort_order=3
        )
        self.admin = User.objects.create_superuser(
            email='admin@example.com', password='password12345', display_name='Admin'
        )
        self.artist = User.objects.create_user(
            email='artist@example.com',
            password='password12345',
            display_name='Artist',
            role='artist',
        )
        ArtistProfile.objects.create(user=self.artist, artist_name='Artist', verified=True)
        self.listener = User.objects.create_user(
            email='listener@example.com', password='password12345', display_name='Listener'
        )
        self.song = Song.objects.create(
            artist=self.artist, title='Track', streams_count=3, listeners_count=1
        )
        for _ in range(3):
            PlayEvent.objects.create(song=self.song, artist=self.artist, user=self.listener)

    def test_artist_report_is_aggregated_server_side(self):
        self.client.force_authenticate(self.artist)
        data = self.client.get(reverse('artist-report')).data
        self.assertEqual(data['total_streams'], 3)
        self.assertEqual(data['unique_listeners'], 1)
        self.assertEqual(data['monthly_streams'], 3)
        self.assertEqual(data['top_songs'][0]['title'], 'Track')

    def test_admin_overview_counts_tiers_and_revenue(self):
        self.listener.subscription_tier = 'gold'
        self.listener.save(update_fields=['subscription_tier'])
        self.client.force_authenticate(self.admin)
        data = self.client.get(reverse('admin-overview')).data
        self.assertEqual(data['tier_counts']['gold'], 1)
        self.assertEqual(data['total_accounts'], 3)
        self.assertEqual(data['monthly_revenue'], Decimal('200000.00'))

    def test_listener_cannot_read_the_admin_overview(self):
        self.client.force_authenticate(self.listener)
        response = self.client.get(reverse('admin-overview'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_payout_rows_are_built_from_play_events(self):
        self.client.force_authenticate(self.admin)
        rows = self.client.get(reverse('payout-list')).data['results']
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['unique_listeners'], 1)
        self.assertEqual(rows[0]['monthly_streams'], 3)
        self.assertEqual(rows[0]['reward_amount'], '104.60')

    def test_settling_a_payout_notifies_the_artist(self):
        self.client.force_authenticate(self.admin)
        self.client.get(reverse('payout-list'))
        payout = Payout.objects.get(artist=self.artist)
        response = self.client.post(reverse('payout-settle', args=[payout.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payout.refresh_from_db()
        self.assertEqual(payout.status, PayoutStatus.SETTLED)
        self.assertTrue(self.artist.notifications.filter(type='monthly_payout').exists())
