from __future__ import annotations

from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel
from apps.common.utils import UploadTo

class Playlist(TimeStampedModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='playlists')
    name = models.CharField(max_length=120)
    cover = models.ImageField(upload_to=UploadTo('playlists/covers'), null=True, blank=True)

    class Meta:
        ordering = ('-updated_at', '-created_at')

    def __str__(self) -> str:
        return self.name

    @property
    def songs(self):
        return Song.objects.filter(items__playlist=self).order_by('items__position', 'items__created_at')

class PlaylistItem(TimeStampedModel):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='items')
    song = models.ForeignKey('catalog.Song', on_delete=models.CASCADE, related_name='playlist_items')
    position = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('playlist', 'song')
        ordering = ('position', 'created_at')

    def __str__(self) -> str:
        return f'{self.playlist_id}:{self.song_id}'

from apps.catalog.models import Song  # noqa: E402  (postponed import for property above)
