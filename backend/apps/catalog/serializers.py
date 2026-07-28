from __future__ import annotations

from rest_framework import serializers
from apps.accounts.models import User
from .models import Album, Song, SubscriptionPlan

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = (
            'id',
            'code',
            'name',
            'monthly_price',
            'max_playlists',
            'daily_stream_limit',
            'can_upload_avatar',
            'can_download',
            'early_access',
            'can_see_stats',
            'sort_order',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class AlbumListSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(source='artist.id', read_only=True)
    artist_display_name = serializers.CharField(source='artist.display_name', read_only=True)
    artist_username = serializers.CharField(source='artist.username', read_only=True)
    song_count = serializers.SerializerMethodField()
    song_ids = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = (
            'id',
            'title',
            'artist_id',
            'artist_display_name',
            'artist_username',
            'cover',
            'release_type',
            'release_year',
            'genre',
            'description',
            'song_count',
            'song_ids',
            'published_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_song_count(self, obj):
        return obj.songs.count()

    def get_song_ids(self, obj):
        return list(obj.songs.values_list('id', flat=True))

class SongListSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(source='artist.id', read_only=True)
    artist_display_name = serializers.CharField(source='artist.display_name', read_only=True)
    artist_username = serializers.CharField(source='artist.username', read_only=True)
    album_id = serializers.IntegerField(source='album.id', allow_null=True, read_only=True)
    album_title = serializers.CharField(source='album.title', allow_null=True, read_only=True)

    class Meta:
        model = Song
        fields = (
            'id',
            'title',
            'artist_id',
            'artist_display_name',
            'artist_username',
            'album_id',
            'album_title',
            'cover',
            'audio_file',
            'duration_seconds',
            'genre',
            'release_year',
            'lyrics',
            'collaborators',
            'listeners_count',
            'streams_count',
            'is_released',
            'published_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class AlbumWriteSerializer(serializers.ModelSerializer):
    artist = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Album
        fields = (
            'id',
            'artist',
            'title',
            'cover',
            'release_type',
            'release_year',
            'genre',
            'description',
            'published_at',
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        artist = attrs.get('artist') or getattr(self.context['request'], 'user', None)
        if artist and artist.role != 'admin' and artist.role != 'artist':
            raise serializers.ValidationError({'artist': 'Only artists or admins can manage albums.'})
        return attrs

    def create(self, validated_data):
        request_user = self.context['request'].user
        artist = validated_data.pop('artist', None) or request_user
        if request_user.role != 'admin':
            artist = request_user
        return Album.objects.create(artist=artist, **validated_data)

    def update(self, instance, validated_data):
        request_user = self.context['request'].user
        if request_user.role != 'admin':
            validated_data.pop('artist', None)
        return super().update(instance, validated_data)

class SongWriteSerializer(serializers.ModelSerializer):
    artist = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    album = serializers.PrimaryKeyRelatedField(queryset=Album.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Song
        fields = (
            'id',
            'artist',
            'album',
            'title',
            'cover',
            'audio_file',
            'lyrics',
            'duration_seconds',
            'genre',
            'release_year',
            'collaborators',
            'listeners_count',
            'streams_count',
            'is_released',
            'published_at',
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        request_user = self.context['request'].user
        artist = attrs.get('artist') or request_user
        if request_user.role != 'admin':
            artist = request_user
        if artist.role not in {'artist', 'admin'}:
            raise serializers.ValidationError({'artist': 'Only artists or admins can manage songs.'})
        album = attrs.get('album')
        if album and album.artist_id != artist.id and request_user.role != 'admin':
            raise serializers.ValidationError({'album': 'Album must belong to the same artist.'})
        return attrs

    def create(self, validated_data):
        request_user = self.context['request'].user
        artist = validated_data.pop('artist', None) or request_user
        album = validated_data.get('album')
        if request_user.role != 'admin':
            artist = request_user
        if album and album.artist_id != artist.id and request_user.role != 'admin':
            raise serializers.ValidationError({'album': 'Album must belong to the same artist.'})
        validated_data['artist'] = artist
        return Song.objects.create(**validated_data)

    def update(self, instance, validated_data):
        request_user = self.context['request'].user
        if request_user.role != 'admin':
            validated_data.pop('artist', None)
        return super().update(instance, validated_data)
