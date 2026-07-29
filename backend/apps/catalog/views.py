from __future__ import annotations

from django.db.models import Q
from rest_framework import filters, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from apps.common.permissions import IsArtistOrAdmin, IsOwnerOrAdmin
from .models import Album, Song, SubscriptionPlan
from .serializers import (
    AlbumListSerializer,
    AlbumWriteSerializer,
    SongListSerializer,
    SongWriteSerializer,
    SubscriptionPlanSerializer,
)

from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.response import Response

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
    filterset_fields = ('code', 'is_active')
    ordering_fields = ('sort_order', 'monthly_price')

    @action(detail=True, methods=["post"])
    def subscribe(self, request, id=None):
        plan = self.get_object()

        months = int(request.data.get("months", 1))

        if months not in (1,3,6,12):
            return Response(
                {"detail":"invalid duration"},
                status=400
            )

        user = request.user

        user.subscription_tier = plan.code

        start = timezone.now()

        if (
            user.subscription_expires_at
            and user.subscription_expires_at > start
        ):
            start = user.subscription_expires_at

        user.subscription_expires_at = start + timedelta(days=30*months)

        user.save()

        return Response({
            "tier":user.subscription_tier,
            "expires":user.subscription_expires_at
        })

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [IsAuthenticated()]
        return [IsAuthenticated()]  # admin restrictions can be added later

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied('Only admins can create pricing plans.')
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            raise PermissionDenied('Only admins can update pricing plans.')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            raise PermissionDenied('Only admins can delete pricing plans.')
        instance.delete()

class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.select_related('artist').prefetch_related('songs').all()
    lookup_field = 'id'
    permission_classes = [IsAuthenticated]
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
        return [IsAuthenticated(), IsArtistOrAdmin()]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        if self.request.user.role != 'admin' and instance.artist_id != self.request.user.id:
            raise PermissionDenied('You can only edit your own albums.')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin' and instance.artist_id != self.request.user.id:
            raise PermissionDenied('You can only delete your own albums.')
        instance.delete()

class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.select_related('artist', 'album').all()
    lookup_field = 'id'
    permission_classes = [IsAuthenticated]
    filterset_fields = ('genre', 'release_year', 'is_released', 'artist', 'album')
    search_fields = ('title', 'artist__display_name', 'artist__username', 'album__title', 'genre')
    ordering_fields = ('published_at', 'created_at', 'title', 'listeners_count', 'streams_count')

    def get_serializer_class(self):
        if self.action in {'create', 'update', 'partial_update'}:
            return SongWriteSerializer
        return SongListSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsArtistOrAdmin()]

    def perform_update(self, serializer):
        instance = self.get_object()
        if self.request.user.role != 'admin' and instance.artist_id != self.request.user.id:
            raise PermissionDenied('You can only edit your own songs.')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin' and instance.artist_id != self.request.user.id:
            raise PermissionDenied('You can only delete your own songs.')
        instance.delete()
