from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.catalog.models import Song, SubscriptionPlan
from .models import Playlist, PlaylistItem

class PlaylistAPITests(APITestCase):
    def setUp(self):
        SubscriptionPlan.objects.create(
            code='basic', name='Basic', monthly_price=0, max_playlists=2, daily_stream_limit=60
        )
        self.user = User.objects.create_user(
            email='listener@example.com', password='password12345', display_name='Listener'
        )
        self.other = User.objects.create_user(
            email='other@example.com', password='password12345', display_name='Other'
        )
        self.artist = User.objects.create_user(
            email='artist@example.com',
            password='password12345',
            display_name='Artist',
            role='artist',
        )
        self.song = Song.objects.create(artist=self.artist, title='Song 1', duration_seconds=200)

    def test_create_playlist(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse('playlist-list'), {'name': 'My List'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Playlist.objects.filter(name='My List', owner=self.user).exists())

    def test_playlist_limit_follows_the_plan(self):
        Playlist.objects.create(owner=self.user, name='A')
        Playlist.objects.create(owner=self.user, name='B')
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse('playlist-list'), {'name': 'Overflow'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_and_remove_song(self):
        playlist = Playlist.objects.create(owner=self.user, name='My List')
        self.client.force_authenticate(self.user)
        url = reverse('playlist-songs', args=[playlist.id, self.song.id])
        self.assertEqual(self.client.post(url).status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlaylistItem.objects.filter(playlist=playlist, song=self.song).exists())
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PlaylistItem.objects.filter(playlist=playlist, song=self.song).exists())

    def test_adding_the_same_song_twice_is_idempotent(self):
        playlist = Playlist.objects.create(owner=self.user, name='My List')
        self.client.force_authenticate(self.user)
        url = reverse('playlist-songs', args=[playlist.id, self.song.id])
        self.client.post(url)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PlaylistItem.objects.filter(playlist=playlist).count(), 1)

    def test_private_playlists_are_invisible_to_others(self):
        Playlist.objects.create(owner=self.other, name='Secret')
        Playlist.objects.create(owner=self.other, name='Shared', is_public=True)
        self.client.force_authenticate(self.user)
        names = [row['name'] for row in self.client.get(reverse('playlist-list')).data['results']]
        self.assertEqual(names, ['Shared'])

    def test_others_cannot_edit_a_playlist(self):
        playlist = Playlist.objects.create(owner=self.other, name='Shared', is_public=True)
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            reverse('playlist-detail', args=[playlist.id]), {'name': 'Mine'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
