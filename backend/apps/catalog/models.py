from __future__ import annotations

from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel
from apps.common.utils import UploadTo
from datetime import timedelta


class SubscriptionPlan(TimeStampedModel):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=80)
    monthly_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    max_playlists = models.PositiveIntegerField(null=True, blank=True)
    daily_stream_limit = models.PositiveIntegerField(null=True, blank=True)
    can_upload_avatar = models.BooleanField(default=False)
    can_download = models.BooleanField(default=False)
    early_access = models.BooleanField(default=False)
    can_see_stats = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def expires_after(self, months: int):
        return timedelta(days=30 * months)

    class Meta:
        ordering = ('sort_order', 'monthly_price')

    def __str__(self) -> str:
        return self.name

class Album(TimeStampedModel):
    class ReleaseType(models.TextChoices):
        SINGLE = 'single', 'Single'
        ALBUM = 'album', 'Album'

    artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='albums')
    title = models.CharField(max_length=160)
    cover = models.ImageField(upload_to=UploadTo('albums/covers'), null=True, blank=True)
    release_type = models.CharField(max_length=10, choices=ReleaseType.choices, default=ReleaseType.ALBUM)
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)
    genre = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-published_at', '-created_at')

    def __str__(self) -> str:
        return self.title

class Song(TimeStampedModel):
    artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='songs')
    album = models.ForeignKey(Album, on_delete=models.SET_NULL, null=True, blank=True, related_name='songs')
    title = models.CharField(max_length=160)
    cover = models.ImageField(upload_to=UploadTo('songs/covers'), null=True, blank=True)
    audio_file = models.FileField(upload_to=UploadTo('songs/audio'), null=True, blank=True)
    lyrics = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    genre = models.CharField(max_length=80, blank=True)
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)
    collaborators = models.JSONField(default=list, blank=True)
    listeners_count = models.PositiveIntegerField(default=0)
    streams_count = models.PositiveIntegerField(default=0)
    is_released = models.BooleanField(default=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-published_at', '-created_at')

    def __str__(self) -> str:
        return self.title
