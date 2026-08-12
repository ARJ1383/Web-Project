from __future__ import annotations

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.catalog.models import Song
from apps.common.permissions import IsOwnerOrAdmin
from .models import Playlist, PlaylistItem
from .serializers import (
    PlaylistDetailSerializer,
    PlaylistListSerializer,
    PlaylistWriteSerializer,
)

class PlaylistViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    owner_field = 'owner_id'
    search_fields = ('name', 'owner__display_name')
    ordering_fields = ('updated_at', 'created_at', 'name')

    def get_queryset(self):
        qs = Playlist.objects.select_related('owner').prefetch_related('items__song')
        user = self.request.user
        if user.role == 'admin':
            return qs
        return qs.filter(Q(owner=user) | Q(is_public=True))

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
        limit = getattr(user.plan, 'max_playlists', None)
        if limit is not None and Playlist.objects.filter(owner=user).count() >= limit:
            raise ValidationError(
                {'detail': f'Playlist limit reached for the {user.subscription_tier} plan.'}
            )
        serializer.save(owner=user)

    @action(detail=True, methods=['post', 'delete'], url_path='songs/(?P<song_id>[0-9]+)')
    def songs(self, request, pk=None, song_id=None):
        playlist = self.get_object()
        if request.method == 'POST':
            song = get_object_or_404(Song, id=song_id)
            _, created = PlaylistItem.objects.get_or_create(
                playlist=playlist,
                song=song,
                defaults={'position': playlist.items.count() + 1},
            )
            playlist.save(update_fields=['updated_at'])
            return Response(
                PlaylistDetailSerializer(playlist).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        deleted, _ = PlaylistItem.objects.filter(playlist=playlist, song_id=song_id).delete()
        if not deleted:
            return Response(
                {'detail': 'Song was not in this playlist.'}, status=status.HTTP_404_NOT_FOUND
            )
        for index, item in enumerate(playlist.items.all(), start=1):
            if item.position != index:
                item.position = index
                item.save(update_fields=['position'])
        playlist.save(update_fields=['updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
