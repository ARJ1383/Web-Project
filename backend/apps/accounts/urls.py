from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ArtistRegisterAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeAPIView,
    RegisterAPIView,
)

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('artist-register/', ArtistRegisterAPIView.as_view(), name='artist-register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeAPIView.as_view(), name='me'),
]
