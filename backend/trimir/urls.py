from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response(
        {
            'auth': '/api/auth/',
            'users': '/api/users/',
            'albums': '/api/albums/',
            'songs': '/api/songs/',
            'playlists': '/api/playlists/',
            'notifications': '/api/notifications/',
            'tickets': '/api/tickets/',
            'payments': '/api/payments/',
            'subscription_plans': '/api/subscription-plans/',
            'reports': '/api/reports/',
        }
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.accounts.api_urls')),
    path('api/', include('apps.catalog.urls')),
    path('api/', include('apps.playlists.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.support.urls')),
    path('api/', include('apps.billing.urls')),
    path('api/', include('apps.reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
