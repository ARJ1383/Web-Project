from __future__ import annotations

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from apps.common.models import TimeStampedModel
from apps.common.utils import unique_handle, UploadTo, validate_image_file


class RoleChoices(models.TextChoices):
    LISTENER = 'listener', 'Listener'
    ARTIST = 'artist', 'Artist'
    SUPPORT = 'support', 'Support'
    ADMIN = 'admin', 'Admin'

class GenderChoices(models.TextChoices):
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'
    OTHER = 'other', 'Other'
    UNSPECIFIED = 'unspecified', 'Unspecified'

class ThemeChoices(models.TextChoices):
    DARK = 'dark', 'Dark'
    LIGHT = 'light', 'Light'

class ArtistStatusChoices(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'

class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError('The email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if not user.username:
            user.username = unique_handle(extra_fields.get('display_name') or email.split('@')[0])
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault('role', RoleChoices.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('display_name', 'Administrator')
        extra_fields.setdefault('username', unique_handle('admin'))
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser, TimeStampedModel):
    username = models.CharField(max_length=150, unique=True, blank=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=120)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.LISTENER)
    avatar = models.ImageField(
        upload_to=UploadTo('avatars'), null=True, blank=True, validators=[validate_image_file]
    )
    bio = models.TextField(blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GenderChoices.choices, default=GenderChoices.UNSPECIFIED)
    subscription_tier = models.CharField(max_length=20, default='basic')
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    notification_limit = models.PositiveSmallIntegerField(default=50)
    volume = models.PositiveSmallIntegerField(default=70)
    language = models.CharField(max_length=5, default='fa')
    theme = models.CharField(max_length=10, choices=ThemeChoices.choices, default=ThemeChoices.DARK)
    daily_stream_count = models.PositiveIntegerField(default=0)
    last_stream_date = models.DateField(null=True, blank=True)

    objects = UserManager()

    @property
    def subscription_active(self) -> bool:
        if self.subscription_tier == 'basic':
            return True
        return bool(self.subscription_expires_at and self.subscription_expires_at > timezone.now())

    @property
    def plan(self):
        """The plan currently in force; expired paid tiers fall back to basic."""
        from apps.catalog.models import SubscriptionPlan

        code = self.subscription_tier if self.subscription_active else 'basic'
        return SubscriptionPlan.objects.filter(code=code).first()

    def extend_subscription(self, months: int, tier: str | None = None) -> None:
        base = self.subscription_expires_at
        if not base or base < timezone.now() or (tier and tier != self.subscription_tier):
            base = timezone.now()
        if tier:
            self.subscription_tier = tier
        self.subscription_expires_at = base + relativedelta(months=months)
        self.save(update_fields=['subscription_tier', 'subscription_expires_at'])

    def consume_stream(self) -> bool:
        """Counts one stream against the daily limit; False when exhausted."""
        today = timezone.localdate()
        count = self.daily_stream_count if self.last_stream_date == today else 0
        limit = getattr(self.plan, 'daily_stream_limit', None)
        if limit is not None and count >= limit:
            return False
        self.daily_stream_count = count + 1
        self.last_stream_date = today
        self.save(update_fields=['daily_stream_count', 'last_stream_date'])
        return True

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['display_name']

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = unique_handle(self.display_name or self.email.split('@')[0])
        self.username = self.username.strip()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f'{self.display_name} <{self.email}>'

class ArtistProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='artist_profile')
    artist_name = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=ArtistStatusChoices.choices, default=ArtistStatusChoices.PENDING)
    status_reason = models.TextField(blank=True)
    verified = models.BooleanField(default=False)
    portfolio_url = models.URLField(blank=True)
    total_listeners = models.PositiveIntegerField(default=0)
    total_streams = models.PositiveIntegerField(default=0)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return self.artist_name

    def set_status(self, status: str, reason: str = '') -> None:
        self.status = status
        self.verified = status == ArtistStatusChoices.APPROVED
        self.status_reason = reason
        self.approved_at = timezone.now() if self.verified else None
        self.save(update_fields=['status', 'verified', 'status_reason', 'approved_at'])

class Follow(TimeStampedModel):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_links')
    target = models.ForeignKey(User, on_delete=models.CASCADE, related_name='follower_links')

    class Meta:
        unique_together = ('follower', 'target')

    def __str__(self) -> str:
        return f'{self.follower_id} -> {self.target_id}'
