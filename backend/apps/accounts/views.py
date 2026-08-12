from __future__ import annotations

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from apps.common.permissions import IsSupportOrAdmin
from apps.notifications.models import NotificationType
from apps.notifications.services import notify, notify_staff
from .models import ArtistStatusChoices, Follow, User
from .serializers import (
    ArtistRegisterSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
    VerificationSerializer,
)

def _tokens_for(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}

def _auth_response(user: User, code: int = status.HTTP_200_OK) -> Response:
    return Response({'user': UserSerializer(user).data, 'tokens': _tokens_for(user)}, status=code)

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return _auth_response(serializer.save(), status.HTTP_201_CREATED)

class ArtistRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ArtistRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        notify_staff(
            NotificationType.NEW_VERIFICATION_REQUEST,
            'درخواست احراز هویت جدید',
            f'هنرمند «{user.display_name}» درخواست تایید ثبت کرد.',
            '/dashboard',
        )
        return _auth_response(user, status.HTTP_201_CREATED)

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data['email']).first()
        if not user or not user.check_password(serializer.validated_data['password']):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)
        return _auth_response(user)

class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        return Response(UserSerializer(serializer.save()).data)

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Public profiles; a user edits their own account through /auth/me/."""

    queryset = User.objects.select_related('artist_profile').order_by('display_name')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('display_name', 'username', 'email')
    filterset_fields = ('role', 'gender', 'subscription_tier')
    ordering_fields = ('display_name', 'created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(display_name__icontains=q) | Q(username__icontains=q) | Q(email__icontains=q)
            )
        return qs

    def get_permissions(self):
        if self.action == 'verify':
            return [IsAuthenticated(), IsSupportOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post', 'delete'])
    def follow(self, request, pk=None):
        target = self.get_object()
        if target.id == request.user.id:
            raise PermissionDenied('You cannot follow yourself.')
        if request.method == 'POST':
            Follow.objects.get_or_create(follower=request.user, target=target)
            return Response({'status': 'following'})
        Follow.objects.filter(follower=request.user, target=target).delete()
        return Response({'status': 'unfollowed'})

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Support/admin decision on an artist verification request."""
        target = self.get_object()
        profile = getattr(target, 'artist_profile', None)
        if not profile:
            return Response(
                {'detail': 'This account is not an artist.'}, status=status.HTTP_400_BAD_REQUEST
            )
        serializer = VerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approved = serializer.validated_data['decision'] == 'approve'
        reason = serializer.validated_data.get('reason', '')
        profile.set_status(
            ArtistStatusChoices.APPROVED if approved else ArtistStatusChoices.REJECTED, reason
        )
        notify(
            target,
            NotificationType.VERIFICATION_RESULT,
            'حساب شما تایید شد' if approved else 'درخواست شما تایید نشد',
            reason or ('حساب هنری شما تایید شد.' if approved else 'درخواست شما رد شد.'),
        )
        return Response(UserSerializer(target).data)

class LogoutAPIView(APIView):
    """Blacklists the refresh token so a logout also ends the server session."""

    def post(self, request):
        token = request.data.get('refresh')
        if not token:
            return Response({'refresh': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(token).blacklist()
        except TokenError:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)
