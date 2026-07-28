from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User, Follow

class AccountsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='listener@example.com',
            password='password12345',
            display_name='Listener One',
        )
        self.artist = User.objects.create_user(
            email='artist@example.com',
            password='password12345',
            display_name='Artist One',
            role='artist',
        )

    def auth(self):
        self.client.force_authenticate(self.user)

    def test_register_creates_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'email': 'new@example.com',
                'password': 'password12345',
                'confirm_password': 'password12345',
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
        self.assertIn('tokens', response.data)

    def test_follow_and_unfollow_user(self):
        self.auth()
        url = reverse('user-follow', args=[self.artist.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Follow.objects.filter(follower=self.user, target=self.artist).exists())
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Follow.objects.filter(follower=self.user, target=self.artist).exists())

    def test_me_endpoint(self):
        self.auth()
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'listener@example.com')
