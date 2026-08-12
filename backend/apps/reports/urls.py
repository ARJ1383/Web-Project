from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AdminOverviewAPIView, ArtistReportAPIView, PayoutViewSet

router = DefaultRouter()
router.register('reports/payouts', PayoutViewSet, basename='payout')

urlpatterns = [
    path('reports/artist/', ArtistReportAPIView.as_view(), name='artist-report'),
    path('reports/overview/', AdminOverviewAPIView.as_view(), name='admin-overview'),
    path('', include(router.urls)),
]
