from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.catalog.models import SubscriptionPlan
from .models import ArtistProfile, Follow, User

class AccountsAPITests(APITestCase):
    def setUp(self):
        SubscriptionPlan.objects.create(
            code='basic', name='Basic', monthly_price=0, max_playlists=6, daily_stream_limit=60
        )
        self.user = User.objects.create_user(
            email='listener@example.com', password='password12345', display_name='Listener One'
        )
        self.artist = User.objects.create_user(
            email='artist@example.com',
            password='password12345',
            display_name='Artist One',
            role='artist',
        )
        ArtistProfile.objects.create(user=self.artist, artist_name='Artist One')
        self.support = User.objects.create_user(
            email='support@example.com',
            password='password12345',
            display_name='Support',
            role='support',
        )

    def test_register_creates_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'email': 'new@example.com',
                'password': 'Trimir-2026-pass',
                'confirm_password': 'Trimir-2026-pass',
                'display_name': 'New User',
                'gender': 'unspecified',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='new@example.com').exists())

    def test_login_returns_tokens(self):
        response = self.client.post(
            reverse('login'),
            {'email': 'listener@example.com', 'password': 'password12345'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['tokens'])

    def test_login_rejects_wrong_password(self):
        response = self.client.post(
            reverse('login'),
            {'email': 'listener@example.com', 'password': 'wrong-password'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_follow_and_unfollow_user(self):
        self.client.force_authenticate(self.user)
        url = reverse('user-follow', args=[self.artist.id])
        self.assertEqual(self.client.post(url).status_code, status.HTTP_200_OK)
        self.assertTrue(Follow.objects.filter(follower=self.user, target=self.artist).exists())
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_200_OK)
        self.assertFalse(Follow.objects.filter(follower=self.user, target=self.artist).exists())

    def test_me_endpoint_accepts_json_patch(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(reverse('me'), {'volume': 42, 'theme': 'light'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual((self.user.volume, self.user.theme), (42, 'light'))

    def test_basic_plan_cannot_upload_avatar(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            reverse('me'), {'avatar': 'not-an-image'}, format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_support_can_approve_artist(self):
        self.client.force_authenticate(self.support)
        response = self.client.post(
            reverse('user-verify', args=[self.artist.id]),
            {'decision': 'approve', 'reason': 'Welcome'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artist.artist_profile.refresh_from_db()
        self.assertTrue(self.artist.artist_profile.verified)
        self.assertTrue(self.artist.notifications.exists())

    def test_listener_cannot_approve_artist(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            reverse('user-verify', args=[self.artist.id]), {'decision': 'approve'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_users_are_read_only_through_the_api(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            reverse('user-detail', args=[self.artist.id]), {'display_name': 'Hacked'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
