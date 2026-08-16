from __future__ import annotations

from django.db.models import F, Q
from django.http import FileResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.common.permissions import (
    HasActiveSubscription,
    IsArtistOrAdmin,
    IsOwnerOrAdmin,
    ReadOnlyOrAdmin,
)
from apps.notifications.models import NotificationType
from apps.notifications.services import notify
from .models import Album, PlayEvent, Song, SubscriptionPlan
from .recommender import recommend_for_user
from .serializers import (
    AlbumListSerializer,
    AlbumWriteSerializer,
    SongListSerializer,
    SongWriteSerializer,
    SubscriptionPlanSerializer,
)

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """Plans are public to signed-in users; only admins change the pricing."""

    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filterset_fields = ('code', 'is_active')
    ordering_fields = ('sort_order', 'monthly_price')

class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.select_related('artist').prefetch_related('songs').all()
    permission_classes = [IsAuthenticated]
    owner_field = 'artist_id'
    filterset_fields = ('release_type', 'release_year', 'genre', 'artist')
    search_fields = ('title', 'artist__display_name', 'artist__username', 'genre')
    ordering_fields = ('published_at', 'created_at', 'title', 'release_year')

    def get_serializer_class(self):
        if self.action in {'create', 'update', 'partial_update'}:
            return AlbumWriteSerializer
        return AlbumListSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsAuthenticated(), IsArtistOrAdmin()]
        return [IsAuthenticated(), IsArtistOrAdmin(), IsOwnerOrAdmin()]

class SongViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    owner_field = 'artist_id'
    plan_feature = 'can_download'
    filterset_fields = ('genre', 'release_year', 'is_released', 'artist', 'album')
    search_fields = ('title', 'artist__display_name', 'artist__username', 'album__title', 'genre')
    ordering_fields = ('published_at', 'created_at', 'title', 'listeners_count', 'streams_count')

    def get_queryset(self):
        qs = Song.objects.select_related('artist', 'album')
        user = self.request.user
        if user.role == 'admin':
            return qs
        # Unreleased tracks stay visible to their own artist and to users whose
        # active subscription explicitly grants early access.
        plan = user.plan
        early_access = bool(plan and plan.early_access)
        if early_access:
            return qs.filter(Q(is_released=True) | Q(artist=user) | Q(is_released=False))
        return qs.filter(Q(is_released=True) | Q(artist=user))

    def get_serializer_class(self):
        if self.action in {'create', 'update', 'partial_update'}:
            return SongWriteSerializer
        return SongListSerializer

    def get_permissions(self):
        if self.action == 'download':
            return [IsAuthenticated(), HasActiveSubscription()]
        if self.action == 'create':
            return [IsAuthenticated(), IsArtistOrAdmin()]
        if self.action in {'update', 'partial_update', 'destroy'}:
            return [IsAuthenticated(), IsArtistOrAdmin(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='recommendations')
    def recommendations(self, request):
        """Return model-generated, non-random recommendations for the current user."""
        songs = list(self.get_queryset().select_related('artist', 'album'))
        ranked = recommend_for_user(request.user.id, songs, limit=6)
        payload = []
        for song, score, reason in ranked:
            payload.append(
                {
                    'song': SongListSerializer(song, context={'request': request}).data,
                    'score': round(score, 6),
                    'reason': reason,
                }
            )
        return Response(payload)

    @action(detail=True, methods=['post'])
    def play(self, request, pk=None):
        """Counts one stream against the caller's daily limit."""
        song = self.get_object()
        user = request.user
        if not user.consume_stream():
            limit = getattr(user.plan, 'daily_stream_limit', 0)
            return Response(
                {'detail': 'Daily stream limit reached.', 'limit': limit},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        first_time = not PlayEvent.objects.filter(song=song, user=user).exists()
        PlayEvent.objects.create(song=song, artist=song.artist, user=user)
        Song.objects.filter(pk=song.pk).update(
            streams_count=F('streams_count') + 1,
            listeners_count=F('listeners_count') + (1 if first_time else 0),
        )
        song.refresh_from_db(fields=['streams_count', 'listeners_count'])
        return Response(
            {
                'streams_count': song.streams_count,
                'listeners_count': song.listeners_count,
                'daily_stream_count': user.daily_stream_count,
            }
        )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        song = self.get_object()
        if not song.audio_file:
            return Response(
                {'detail': 'This track has no audio file.'}, status=status.HTTP_404_NOT_FOUND
            )
        filename = song.audio_file.name.rsplit('/', 1)[-1] or f'{song.title}.mp3'
        response = FileResponse(song.audio_file.open('rb'), as_attachment=True, filename=filename)
        return response

    def perform_create(self, serializer):
        song = serializer.save()
        if song.is_released:
            self._announce_release(song)

    def _announce_release(self, song) -> None:
        for follow in song.artist.follower_links.select_related('follower'):
            notify(
                follow.follower,
                NotificationType.NEW_RELEASE,
                'انتشار اثر جدید',
                f'{song.artist.display_name} آهنگ تازه‌ای منتشر کرد: «{song.title}».',
                f'/artist/{song.artist_id}',
            )
