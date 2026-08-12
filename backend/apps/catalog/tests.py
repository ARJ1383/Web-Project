from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import ArtistProfile, User
from .models import Album, PlayEvent, Song, SubscriptionPlan

class CatalogAPITests(APITestCase):
    def setUp(self):
        self.basic = SubscriptionPlan.objects.create(
            code='basic',
            name='Basic',
            monthly_price=0,
            max_playlists=6,
            daily_stream_limit=2,
            sort_order=1,
        )
        self.gold = SubscriptionPlan.objects.create(
            code='gold',
            name='Gold',
            monthly_price=199000,
            daily_stream_limit=None,
            can_download=True,
            sort_order=3,
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
        self.song = Song.objects.create(artist=self.artist, title='Track', duration_seconds=120)

    def test_artist_can_create_album_with_json(self):
        self.client.force_authenticate(self.artist)
        response = self.client.post(
            reverse('album-list'),
            {'title': 'First Album', 'release_type': 'album', 'genre': 'Pop'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Album.objects.filter(title='First Album', artist=self.artist).exists())

    def test_listener_cannot_create_album(self):
        self.client.force_authenticate(self.listener)
        response = self.client.post(
            reverse('album-list'), {'title': 'Nope', 'release_type': 'album'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_artist_cannot_edit_another_artists_song(self):
        other = User.objects.create_user(
            email='other@example.com',
            password='password12345',
            display_name='Other',
            role='artist',
        )
        ArtistProfile.objects.create(user=other, artist_name='Other')
        self.client.force_authenticate(other)
        response = self.client.patch(
            reverse('song-detail', args=[self.song.id]), {'title': 'Stolen'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_stream_counters_are_read_only(self):
        self.client.force_authenticate(self.artist)
        self.client.patch(
            reverse('song-detail', args=[self.song.id]), {'streams_count': 9999}, format='json'
        )
        self.song.refresh_from_db()
        self.assertEqual(self.song.streams_count, 0)

    def test_unreleased_songs_are_hidden_from_listeners(self):
        Song.objects.create(artist=self.artist, title='Draft', is_released=False)
        self.client.force_authenticate(self.listener)
        titles = [row['title'] for row in self.client.get(reverse('song-list')).data['results']]
        self.assertIn('Track', titles)
        self.assertNotIn('Draft', titles)

    def test_play_counts_streams_and_unique_listeners(self):
        self.client.force_authenticate(self.listener)
        url = reverse('song-play', args=[self.song.id])
        self.assertEqual(self.client.post(url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post(url).status_code, status.HTTP_200_OK)
        self.song.refresh_from_db()
        self.assertEqual(self.song.streams_count, 2)
        self.assertEqual(self.song.listeners_count, 1)
        self.assertEqual(PlayEvent.objects.filter(user=self.listener).count(), 2)

    def test_daily_stream_limit_is_enforced(self):
        self.client.force_authenticate(self.listener)
        url = reverse('song-play', args=[self.song.id])
        self.client.post(url)
        self.client.post(url)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_download_requires_a_plan_that_allows_it(self):
        self.client.force_authenticate(self.listener)
        url = reverse('song-download', args=[self.song.id])
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        self.listener.subscription_tier = 'gold'
        self.listener.subscription_expires_at = timezone.now() + timezone.timedelta(days=30)
        self.listener.save()
        # The plan allows it, but this track has no audio file yet.
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_only_admins_change_the_pricing(self):
        plan_url = reverse('subscription-plan-detail', args=[self.gold.id])
        self.client.force_authenticate(self.listener)
        self.assertEqual(
            self.client.patch(plan_url, {'monthly_price': '1'}, format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.client.force_authenticate(self.admin)
        response = self.client.patch(plan_url, {'monthly_price': '250000'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.gold.refresh_from_db()
        self.assertEqual(str(self.gold.monthly_price), '250000.00')

    def test_new_release_notifies_followers(self):
        from apps.accounts.models import Follow

        Follow.objects.create(follower=self.listener, target=self.artist)
        self.client.force_authenticate(self.artist)
        # multipart, like the studio upload form
        response = self.client.post(reverse('song-list'), {'title': 'Fresh'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Song.objects.get(title='Fresh').is_released)
        self.assertTrue(self.listener.notifications.filter(type='new_release').exists())
