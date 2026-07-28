from rest_framework.routers import DefaultRouter
from django.urls import include, path
from .views import AlbumViewSet, SongViewSet, SubscriptionPlanViewSet

router = DefaultRouter()
router.register('albums', AlbumViewSet, basename='album')
router.register('songs', SongViewSet, basename='song')
router.register('subscription-plans', SubscriptionPlanViewSet, basename='subscription-plan')

urlpatterns = [
    path('', include(router.urls)),
]
