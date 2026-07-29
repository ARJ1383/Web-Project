from __future__ import annotations

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from apps.catalog.models import Song, SubscriptionPlan
from apps.common.permissions import IsOwnerOrAdmin
from .models import Playlist, PlaylistItem
from .serializers import (
    PlaylistDetailSerializer,
    PlaylistListSerializer,
    PlaylistSongSerializer,
    PlaylistWriteSerializer,
)

class PlaylistViewSet(viewsets.ModelViewSet):
    lookup_field = 'id'
    permission_classes = [IsAuthenticated, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = Playlist.objects.select_related('owner').prefetch_related('items__song').all()
        user = self.request.user
        if getattr(user, 'role', None) == 'admin':
            return qs
        return qs.filter(owner=user)

    def get_serializer_class(self):
        if self.action in {'create', 'update', 'partial_update'}:
            return PlaylistWriteSerializer
        if self.action == 'retrieve':
            return PlaylistDetailSerializer
        return PlaylistListSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve', 'create'}:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrAdmin()]

    def perform_create(self, serializer):
        user = self.request.user
        plan = SubscriptionPlan.objects.filter(code=user.subscription_tier).first()
        playlist_limit = plan.max_playlists if plan else None
        current_count = Playlist.objects.filter(owner=user).count()
        if playlist_limit is not None and current_count >= playlist_limit:
            raise ValidationError({'detail': f'Playlist limit reached for {user.subscription_tier} tier.'})
        serializer.save(owner=user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if self.request.user.role != 'admin' and instance.owner_id != self.request.user.id:
            raise PermissionDenied('You can only edit your own playlists.')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin' and instance.owner_id != self.request.user.id:
            raise PermissionDenied('You can only delete your own playlists.')
        instance.delete()

class PlaylistSongAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_playlist(self, playlist_id):
        playlist = get_object_or_404(Playlist.objects.select_related('owner'), id=playlist_id)
        if self.request.user.role != 'admin' and playlist.owner_id != self.request.user.id:
            raise PermissionDenied('You can only manage songs in your own playlist.')
        return playlist

    def post(self, request, playlist_id, song_id):
        playlist = self._get_playlist(playlist_id)
        song = get_object_or_404(Song, id=song_id)
        if PlaylistItem.objects.filter(playlist=playlist, song=song).exists():
            return Response({'detail': 'Song already exists in this playlist.'}, status=status.HTTP_200_OK)
        next_position = PlaylistItem.objects.filter(playlist=playlist).count() + 1
        PlaylistItem.objects.create(playlist=playlist, song=song, position=next_position)
        playlist.save(update_fields=['updated_at'])
        return Response(PlaylistDetailSerializer(playlist).data, status=status.HTTP_201_CREATED)

    def delete(self, request, playlist_id, song_id):
        playlist = self._get_playlist(playlist_id)
        deleted, _ = PlaylistItem.objects.filter(playlist=playlist, song_id=song_id).delete()
        if not deleted:
            return Response({'detail': 'Song was not in this playlist.'}, status=status.HTTP_404_NOT_FOUND)
        items = PlaylistItem.objects.filter(playlist=playlist).order_by('position', 'created_at')
        for index, item in enumerate(items, start=1):
            if item.position != index:
                item.position = index
                item.save(update_fields=['position'])
        playlist.save(update_fields=['updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
