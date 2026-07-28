from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from .models import Album, Song, SubscriptionPlan

class CatalogAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='password12345',
            display_name='Admin',
        )
        self.artist = User.objects.create_user(
            email='artist@example.com',
            password='password12345',
            display_name='Artist',
            role='artist',
        )
        self.plan = SubscriptionPlan.objects.create(
            code='basic',
            name='Basic',
            monthly_price=0,
            max_playlists=6,
            daily_stream_limit=60,
            sort_order=1,
        )

    def test_subscription_plan_list(self):
        self.client.force_authenticate(self.artist)
        response = self.client.get(reverse('subscription-plan-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_artist_can_create_album(self):
        self.client.force_authenticate(self.artist)
        response = self.client.post(
            reverse('album-list'),
            {'title': 'First Album', 'release_type': 'album', 'genre': 'Pop'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Album.objects.filter(title='First Album').exists())

    def test_artist_can_create_song(self):
        album = Album.objects.create(artist=self.artist, title='Album', release_type='album')
        self.client.force_authenticate(self.artist)
        response = self.client.post(
            reverse('song-list'),
            {'title': 'Track 1', 'album': str(album.id), 'duration_seconds': 180},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Song.objects.filter(title='Track 1').exists())

    def test_listener_cannot_create_album(self):
        listener = User.objects.create_user(
            email='listener@example.com',
            password='password12345',
            display_name='Listener',
        )
        self.client.force_authenticate(listener)
        response = self.client.post(
            reverse('album-list'),
            {'title': 'Nope', 'release_type': 'album'},
            format='json',
        )
        self.assertIn(response.status_code, {status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST})
