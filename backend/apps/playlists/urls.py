from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import PlaylistSongAPIView, PlaylistViewSet

router = DefaultRouter()
router.register('playlists', PlaylistViewSet, basename='playlist')

urlpatterns = [
    path('', include(router.urls)),
    path('playlists/<uuid:playlist_id>/songs/<uuid:song_id>/', PlaylistSongAPIView.as_view(), name='playlist-song'),
]
