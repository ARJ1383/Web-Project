from __future__ import annotations

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.permissions import IsSelfOrAdmin
from .models import Follow, User
from .serializers import (
    ArtistRegisterSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

def _tokens_for(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'user': UserSerializer(user).data, 'tokens': _tokens_for(user)}, status=status.HTTP_201_CREATED)

class ArtistRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ArtistRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'user': UserSerializer(user).data, 'tokens': _tokens_for(user)}, status=status.HTTP_201_CREATED)

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'user': UserSerializer(user).data, 'tokens': _tokens_for(user)})

class MeAPIView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)

    def put(self, request):
        return self.patch(request)

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('artist_profile').all().order_by('display_name')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    search_fields = ('display_name', 'username', 'email', 'role')
    filterset_fields = ('role', 'gender', 'subscription_tier')
    ordering_fields = ('display_name', 'created_at', 'subscription_tier')

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(display_name__icontains=q) |
                Q(username__icontains=q) |
                Q(email__icontains=q)
            )
        return qs

    def get_serializer_class(self):
        if self.action in {'update', 'partial_update'}:
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [IsAuthenticated()]
        if self.action in {'follow'}:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsSelfOrAdmin()]

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=['post', 'delete'], url_path='follow')
    def follow(self, request, id=None):
        target = self.get_object()
        if target.id == request.user.id:
            raise PermissionDenied('You cannot follow yourself.')
        if request.method == 'POST':
            Follow.objects.get_or_create(follower=request.user, target=target)
            return Response({'status': 'following'})
        Follow.objects.filter(follower=request.user, target=target).delete()
        return Response({'status': 'unfollowed'})
