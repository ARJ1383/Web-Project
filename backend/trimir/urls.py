from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def api_root(request):
    return Response(
        {
            'auth': '/api/auth/',
            'users': '/api/users/',
            'albums': '/api/albums/',
            'songs': '/api/songs/',
            'playlists': '/api/playlists/',
            'subscription_plans': '/api/subscription-plans/',
        }
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.accounts.api_urls')),
    path('api/', include('apps.catalog.urls')),
    path('api/', include('apps.playlists.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
