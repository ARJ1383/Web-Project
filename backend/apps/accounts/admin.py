from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import ArtistProfile, Follow, User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ('email',)
    list_display = ('email', 'display_name', 'username', 'role', 'is_staff', 'is_active')
    search_fields = ('email', 'display_name', 'username')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Profile', {'fields': ('username', 'display_name', 'role', 'avatar', 'bio', 'birth_date', 'gender')}),
        ('Subscription', {'fields': ('subscription_tier', 'subscription_expires_at')}),
        ('Preferences', {'fields': ('notification_limit', 'volume', 'language', 'theme', 'daily_stream_count', 'last_stream_date')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'display_name', 'password1', 'password2', 'role', 'is_staff', 'is_superuser'),
        }),
    )

@admin.register(ArtistProfile)
class ArtistProfileAdmin(admin.ModelAdmin):
    list_display = ('artist_name', 'user', 'status', 'verified', 'total_listeners', 'total_streams')
    search_fields = ('artist_name', 'user__email', 'user__display_name')
    list_filter = ('status', 'verified')

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'target', 'created_at')
