from __future__ import annotations

from decimal import Decimal
from datetime import timedelta
from pathlib import Path
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import ArtistProfile, ArtistStatusChoices, Follow, RoleChoices, User
from apps.catalog.models import Album, PlayEvent, Song, SubscriptionPlan
from apps.catalog.serializers import probe_duration
from apps.notifications.models import NotificationType
from apps.notifications.services import notify
from apps.playlists.models import Playlist, PlaylistItem
from apps.support.models import SenderRole, Ticket, TicketMessage, TicketStatus

PASSWORD = 'password123'
AUDIO_DIR = Path(__file__).resolve().parents[5] / 'public' / 'audio'

PLANS = [
    {
        'code': 'basic',
        'name': 'پایه',
        'monthly_price': Decimal('0'),
        'max_playlists': 6,
        'daily_stream_limit': 60,
        'can_upload_avatar': False,
        'can_download': False,
        'early_access': False,
        'can_see_stats': False,
        'sort_order': 1,
    },
    {
        'code': 'silver',
        'name': 'نقره‌ای',
        'monthly_price': Decimal('129000'),
        'max_playlists': 100,
        'daily_stream_limit': None,
        'can_upload_avatar': True,
        'can_download': True,
        'early_access': False,
        'can_see_stats': False,
        'sort_order': 2,
    },
    {
        'code': 'gold',
        'name': 'طلایی',
        'monthly_price': Decimal('199000'),
        'max_playlists': None,
        'daily_stream_limit': None,
        'can_upload_avatar': True,
        'can_download': True,
        'early_access': True,
        'can_see_stats': True,
        'sort_order': 3,
    },
]

LISTENERS = [
    ('sara@trimir.app', 'سارا محمدی', 'listener', 'gold', 'دوستدار موسیقی الکترونیک.'),
    ('ali@trimir.app', 'علی رضایی', 'listener', 'basic', ''),
    ('nina@trimir.app', 'نینا کریمی', 'listener', 'silver', ''),
    ('support@trimir.app', 'رضا (پشتیبانی)', 'support', 'basic', ''),
    ('admin@trimir.app', 'مدیر سامانه', 'admin', 'gold', ''),
]

ARTISTS = [
    ('aurora@trimir.app', 'Aurora Skye', 'approved', 'gold', 'Dream-pop and ambient soundscapes.', ''),
    ('neon@trimir.app', 'Neon Pulse', 'approved', 'silver', 'Synthwave and retro electronica.', ''),
    ('lofi@trimir.app', 'Lo-Fi Lab', 'approved', 'basic', 'Beats to study and relax to.', ''),
    ('mehr@trimir.app', 'مهر', 'pending', 'basic', 'هنرمند تازه‌وارد.', 'https://example.com/mehr-demo'),
]

ALBUMS = [
    ('Nightfall', 'aurora@trimir.app', 2025, 'Dream Pop'),
    ('Drive', 'neon@trimir.app', 2024, 'Synthwave'),
]

# title, artist, album, audio file stem, listeners, streams, lyrics
SONGS = [
    ('Horizon', 'aurora@trimir.app', 'Nightfall', 'song_horizon', 18420, 96000,
     'در افق دور، نور می‌تابد\nHorizon calls beyond the sea'),
    ('Aurora Lights', 'aurora@trimir.app', 'Nightfall', 'song_aurora_lights', 15300, 81000, ''),
    ('Still Water', 'aurora@trimir.app', 'Nightfall', 'song_still_water', 9900, 52000,
     'Still water runs deep and slow'),
    ('Midnight Drive', 'neon@trimir.app', 'Drive', 'song_midnight_drive', 9100, 70000, ''),
    ('Chrome', 'neon@trimir.app', 'Drive', 'song_chrome', 7600, 62000, ''),
    ('Rainy Window', 'lofi@trimir.app', None, 'song_rainy_window', 30200, 145000,
     'پشت پنجره، باران می‌بارد'),
]

class Command(BaseCommand):
    help = 'Creates the demo plans, accounts, catalog, playlists and tickets.'

    @transaction.atomic
    def handle(self, *args, **options):
        for data in PLANS:
            SubscriptionPlan.objects.update_or_create(code=data['code'], defaults=data)

        users: dict[str, User] = {}
        expiry = timezone.now() + timedelta(days=90)
        for email, name, role, tier, bio in LISTENERS:
            users[email] = self._user(email, name, role, tier, bio, expiry)

        for email, name, artist_status, tier, bio, portfolio in ARTISTS:
            user = self._user(email, name, RoleChoices.ARTIST, tier, bio, expiry)
            ArtistProfile.objects.update_or_create(
                user=user,
                defaults={
                    'artist_name': name,
                    'status': artist_status,
                    'verified': artist_status == ArtistStatusChoices.APPROVED,
                    'portfolio_url': portfolio,
                    'approved_at': timezone.now() if artist_status == 'approved' else None,
                },
            )
            users[email] = user

        albums: dict[str, Album] = {}
        for title, artist_email, year, genre in ALBUMS:
            albums[title], _ = Album.objects.update_or_create(
                title=title,
                artist=users[artist_email],
                defaults={'release_year': year, 'genre': genre, 'published_at': timezone.now()},
            )

        songs: dict[str, Song] = {}
        for title, artist_email, album_title, stem, listeners, streams, lyrics in SONGS:
            song, _ = Song.objects.update_or_create(
                title=title,
                artist=users[artist_email],
                defaults={
                    'album': albums.get(album_title),
                    'lyrics': lyrics,
                    'listeners_count': listeners,
                    'streams_count': streams,
                    'revenue': Decimal(streams) * Decimal('4.2'),
                    'published_at': timezone.now(),
                },
            )
            self._attach_audio(song, stem)
            songs[title] = song

        for follower, target in (
            ('sara@trimir.app', 'aurora@trimir.app'),
            ('sara@trimir.app', 'neon@trimir.app'),
            ('ali@trimir.app', 'aurora@trimir.app'),
            ('nina@trimir.app', 'lofi@trimir.app'),
        ):
            Follow.objects.get_or_create(follower=users[follower], target=users[target])

        self._playlist(users['sara@trimir.app'], 'Chill Evenings', [songs['Still Water'], songs['Rainy Window']])
        self._playlist(users['sara@trimir.app'], 'Night Drive', [songs['Midnight Drive'], songs['Chrome']])

        # A play is never unique, so only seed listeners who have not played the song.
        for listener in ('sara@trimir.app', 'ali@trimir.app', 'nina@trimir.app'):
            for song in list(songs.values())[:3]:
                user = users[listener]
                if not PlayEvent.objects.filter(song=song, user=user).exists():
                    PlayEvent.objects.create(song=song, artist=song.artist, user=user)

        self._ticket(
            users['ali@trimir.app'],
            'مشکل در ارتقای اشتراک',
            'می‌خواهم اشتراکم را ارتقا بدهم، اما صفحه پرداخت باز نمی‌شود.',
        )
        self._ticket(
            users['nina@trimir.app'],
            'پلی‌لیست جدید ساخته نمی‌شود',
            'وقتی پلی‌لیست جدید می‌سازم هیچ اتفاقی نمی‌افتد.',
        )

        notify(
            users['nina@trimir.app'],
            NotificationType.SUBSCRIPTION_EXPIRY,
            'پایان اشتراک نزدیک است',
            'اشتراک نقره‌ای شما به‌زودی منقضی می‌شود.',
            '/settings',
        )
        notify(
            users['aurora@trimir.app'],
            NotificationType.VERIFICATION_RESULT,
            'حساب شما تایید شد',
            'حساب هنری شما توسط تیم پشتیبانی تایید شد.',
        )

        self.stdout.write(self.style.SUCCESS(f'Demo data ready. Password for every account: {PASSWORD}'))

    def _user(self, email, display_name, role, tier, bio, expiry) -> User:
        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create_user(email=email, password=PASSWORD, display_name=display_name, role=role)
        user.display_name = display_name
        user.role = role
        user.bio = bio
        user.subscription_tier = tier
        user.subscription_expires_at = None if tier == 'basic' else expiry
        user.is_staff = role == RoleChoices.ADMIN
        user.is_superuser = role == RoleChoices.ADMIN
        user.set_password(PASSWORD)
        user.save()
        return user

    def _attach_audio(self, song: Song, stem: str) -> None:
        if song.audio_file:
            return
        source = AUDIO_DIR / f'{stem}.mp3'
        if not source.exists():
            self.stdout.write(self.style.WARNING(f'Missing demo audio: {source}'))
            return
        with source.open('rb') as handle:
            song.audio_file.save(source.name, File(handle), save=False)
        song.duration_seconds = probe_duration(song.audio_file)
        song.save(update_fields=['audio_file', 'duration_seconds'])

    def _playlist(self, owner: User, name: str, songs: list[Song]) -> None:
        playlist, _ = Playlist.objects.get_or_create(owner=owner, name=name)
        for position, song in enumerate(songs, start=1):
            PlaylistItem.objects.get_or_create(
                playlist=playlist, song=song, defaults={'position': position}
            )

    def _ticket(self, user: User, subject: str, body: str) -> None:
        ticket, created = Ticket.objects.get_or_create(
            user=user, subject=subject, defaults={'status': TicketStatus.OPEN}
        )
        if created:
            TicketMessage.objects.create(
                ticket=ticket,
                sender=user,
                sender_role=SenderRole.USER,
                sender_name=user.display_name,
                body=body,
            )
