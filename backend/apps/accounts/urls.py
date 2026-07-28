from django.urls import path
from .views import ArtistRegisterAPIView, LoginAPIView, MeAPIView, RegisterAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('artist-register/', ArtistRegisterAPIView.as_view(), name='artist-register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('me/', MeAPIView.as_view(), name='me'),
]
