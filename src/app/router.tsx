import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth, RequireRole } from '@/lib/guards';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { HomePage } from '@/features/home/HomePage';
import { UserProfilePage } from '@/features/profile/UserProfilePage';
import { ArtistProfilePage } from '@/features/artist/ArtistProfilePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { PaymentCallbackPage } from '@/features/settings/PaymentCallbackPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { PlaylistsPage } from '@/features/playlists/PlaylistsPage';
import { PlaylistDetailPage } from '@/features/playlists/PlaylistDetailPage';
import { AlbumsPage } from '@/features/albums/AlbumsPage';
import { AlbumDetailPage } from '@/features/albums/AlbumDetailPage';
import { PlayerPage } from '@/features/player/PlayerPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NotFoundPage } from '@/features/placeholder/NotFoundPage';
import { ArtistStudioPage } from '@/features/studio/ArtistStudioPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'playlists', element: <PlaylistsPage /> },
          { path: 'playlists/:id', element: <PlaylistDetailPage /> },
          { path: 'profile', element: <UserProfilePage /> },
          { path: 'profile/:id', element: <UserProfilePage /> },
          { path: 'artist/:id', element: <ArtistProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'payment/callback', element: <PaymentCallbackPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'albums', element: <AlbumsPage /> },
          { path: 'albums/:id', element: <AlbumDetailPage /> },
          { path: 'player', element: <PlayerPage /> },
          {
            element: <RequireRole roles={['artist']} />,
            children: [{ path: 'studio', element: <ArtistStudioPage /> }],
          },
          {
            element: <RequireRole roles={['support', 'admin']} />,
            children: [{ path: 'dashboard', element: <DashboardPage /> }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
