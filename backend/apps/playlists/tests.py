from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.catalog.models import Song, SubscriptionPlan
from .models import Playlist, PlaylistItem

class PlaylistAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='listener@example.com',
            password='password12345',
            display_name='Listener',
            subscription_tier='basic',
        )
        self.artist = User.objects.create_user(
            email='artist@example.com',
            password='password12345',
            display_name='Artist',
            role='artist',
        )
        self.song = Song.objects.create(
            artist=self.artist,
            title='Song 1',
            duration_seconds=200,
        )
        SubscriptionPlan.objects.create(
            code='basic',
            name='Basic',
            monthly_price=0,
            max_playlists=6,
            daily_stream_limit=60,
            sort_order=1,
        )

    def test_create_playlist(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse('playlist-list'), {'name': 'My List'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Playlist.objects.filter(name='My List').exists())

    def test_add_song_to_playlist(self):
        playlist = Playlist.objects.create(owner=self.user, name='My List')
        self.client.force_authenticate(self.user)
        url = reverse('playlist-song', args=[playlist.id, self.song.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlaylistItem.objects.filter(playlist=playlist, song=self.song).exists())

    def test_playlist_limit_respected(self):
        for i in range(6):
            Playlist.objects.create(owner=self.user, name=f'L{i}')
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse('playlist-list'), {'name': 'Overflow'}, format='json')
        self.assertIn(response.status_code, {status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN})
