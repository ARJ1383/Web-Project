from django.contrib import admin
from .models import Playlist, PlaylistItem

class PlaylistItemInline(admin.TabularInline):
    model = PlaylistItem
    extra = 0
    autocomplete_fields = ('song',)

@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at', 'updated_at')
    search_fields = ('name', 'owner__display_name', 'owner__email')
    inlines = [PlaylistItemInline]

@admin.register(PlaylistItem)
class PlaylistItemAdmin(admin.ModelAdmin):
    list_display = ('playlist', 'song', 'position', 'created_at')
    search_fields = ('playlist__name', 'song__title')
