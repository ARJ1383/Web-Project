from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from apps.catalog.models import SubscriptionPlan
from .models import ArtistProfile, Follow, RoleChoices, User, ArtistStatusChoices

class ArtistProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistProfile
        fields = (
            'artist_name',
            'status',
            'status_reason',
            'verified',
            'portfolio_url',
            'total_listeners',
            'total_streams',
            'approved_at',
        )
        read_only_fields = fields

class UserSerializer(serializers.ModelSerializer):
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    artist_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'display_name',
            'role',
            'avatar',
            'bio',
            'birth_date',
            'gender',
            'subscription_tier',
            'subscription_expires_at',
            'notification_limit',
            'volume',
            'language',
            'daily_stream_count',
            'last_stream_date',
            'follower_count',
            'following_count',
            'artist_profile',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'username', 'daily_stream_count', 'last_stream_date', 'created_at', 'updated_at')

    def get_follower_count(self, obj):
        return obj.follower_links.count()

    def get_following_count(self, obj):
        return obj.following_links.count()

    def get_artist_profile(self, obj):
        profile = getattr(obj, 'artist_profile', None)
        if not profile:
            return None
        return ArtistProfileSerializer(profile).data

class UserUpdateSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(required=False, allow_blank=False)
    portfolio_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = (
            'display_name',
            'avatar',
            'bio',
            'birth_date',
            'gender',
            'notification_limit',
            'volume',
            'language',
            'artist_name',
            'portfolio_url',
        )

    def update(self, instance, validated_data):
        artist_name = validated_data.pop('artist_name', None)
        portfolio_url = validated_data.pop('portfolio_url', None)
        instance = super().update(instance, validated_data)
        if instance.role in {RoleChoices.ARTIST, RoleChoices.ADMIN} and (artist_name or portfolio_url is not None):
            profile, _ = ArtistProfile.objects.get_or_create(user=instance, defaults={'artist_name': instance.display_name})
            if artist_name:
                profile.artist_name = artist_name
            if portfolio_url is not None:
                profile.portfolio_url = portfolio_url
            profile.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    birth_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'confirm_password', 'display_name', 'birth_date', 'gender')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            display_name=validated_data['display_name'],
            birth_date=validated_data.get('birth_date'),
            gender=validated_data.get('gender', 'unspecified'),
            role=RoleChoices.LISTENER,
            subscription_tier='basic',
        )
        basic_plan = SubscriptionPlan.objects.filter(code='basic').first()
        if basic_plan and basic_plan.daily_stream_limit is not None:
            user.daily_stream_count = 0
            user.save(update_fields=['daily_stream_count'])
        return user

class ArtistRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    portfolio_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'confirm_password', 'artist_name', 'portfolio_url')

    artist_name = serializers.CharField()

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        artist_name = validated_data.pop('artist_name')
        portfolio_url = validated_data.pop('portfolio_url', '')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            display_name=artist_name,
            role=RoleChoices.ARTIST,
            subscription_tier='basic',
        )
        ArtistProfile.objects.create(
            user=user,
            artist_name=artist_name,
            status=ArtistStatusChoices.PENDING,
            verified=False,
            portfolio_url=portfolio_url or '',
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class FollowSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()
