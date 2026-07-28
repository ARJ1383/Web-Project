from django.contrib import admin
from .models import Album, Song, SubscriptionPlan

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'monthly_price', 'max_playlists', 'daily_stream_limit', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('is_active',)

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'release_type', 'release_year', 'published_at')
    search_fields = ('title', 'artist__display_name', 'artist__email')
    list_filter = ('release_type', 'release_year')

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'album', 'release_year', 'listeners_count', 'streams_count', 'is_released')
    search_fields = ('title', 'artist__display_name', 'artist__email', 'album__title')
    list_filter = ('is_released', 'release_year', 'genre')
