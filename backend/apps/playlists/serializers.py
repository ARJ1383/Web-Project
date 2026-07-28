from __future__ import annotations

from rest_framework import serializers
from apps.catalog.serializers import SongListSerializer
from apps.catalog.models import Song
from .models import Playlist, PlaylistItem

class PlaylistListSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_display_name = serializers.CharField(source='owner.display_name', read_only=True)
    song_count = serializers.SerializerMethodField()
    song_ids = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = (
            'id',
            'name',
            'owner_id',
            'owner_display_name',
            'cover',
            'song_count',
            'song_ids',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_song_count(self, obj):
        return obj.items.count()

    def get_song_ids(self, obj):
        return list(obj.items.values_list('song_id', flat=True))

class PlaylistDetailSerializer(PlaylistListSerializer):
    songs = SongListSerializer(many=True, read_only=True, source='songs')

    class Meta(PlaylistListSerializer.Meta):
        fields = PlaylistListSerializer.Meta.fields + ('songs',)

class PlaylistWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ('id', 'name', 'cover')
        read_only_fields = ('id',)

class PlaylistSongSerializer(serializers.Serializer):
    song_id = serializers.IntegerField()
