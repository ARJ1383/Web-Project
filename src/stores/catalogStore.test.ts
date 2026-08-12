import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCatalogStore } from './catalogStore';
import { useAuthStore } from './authStore';
import { setTokens } from '@/lib/api';
import { apiSong, apiUser, mockApi, paginated, signIn } from '@/test/api-mock';

const apiAlbum = {
  id: 3,
  title: 'Nightfall',
  artist_id: 7,
  artist_display_name: 'Aurora Skye',
  cover: null,
  release_type: 'album' as const,
  release_year: 2025,
  genre: 'Dream Pop',
  song_ids: [5],
  created_at: '2026-01-01T00:00:00Z',
};

const apiPlan = {
  id: 2,
  code: 'silver' as const,
  name: 'نقره‌ای',
  monthly_price: '150000.00',
  currency: 'تومان',
  max_playlists: 42,
  daily_stream_limit: null,
  can_upload_avatar: true,
  can_download: true,
  early_access: false,
  can_see_stats: false,
  is_active: true,
  sort_order: 2,
};

beforeEach(() => {
  vi.unstubAllGlobals();
  setTokens(null);
  useCatalogStore.setState({ users: [], artists: [], songs: [], albums: [], plans: [] });
  useAuthStore.setState({ currentUser: null, ready: true });
});

describe('catalogStore', () => {
  it('hydrates users, songs, albums and plans from the API', async () => {
    signIn();
    mockApi({
      'GET /users/': { body: paginated([apiUser]) },
      'GET /songs/': { body: paginated([apiSong]) },
      'GET /albums/': { body: paginated([apiAlbum]) },
      'GET /subscription-plans/': { body: paginated([apiPlan]) },
    });

    await useCatalogStore.getState().hydrate();
    const state = useCatalogStore.getState();
    expect(state.users.map((u) => u.id)).toEqual(['1']);
    expect(state.getSongById('5')?.title).toBe('Horizon');
    expect(state.getAlbumById('3')?.songIds).toEqual(['5']);
    expect(state.plans[0].maxPlaylists).toBe(42);
  });

  it('separates artists from listeners while hydrating', async () => {
    signIn();
    const artist = {
      ...apiUser,
      id: 7,
      role: 'artist' as const,
      display_name: 'Aurora Skye',
      artist_profile: {
        artist_name: 'Aurora Skye',
        status: 'approved' as const,
        verified: true,
        total_listeners: 100,
        total_streams: 900,
      },
    };
    mockApi({
      'GET /users/': { body: paginated([apiUser, artist]) },
      'GET /songs/': { body: paginated([]) },
      'GET /albums/': { body: paginated([]) },
      'GET /subscription-plans/': { body: paginated([]) },
    });

    await useCatalogStore.getState().hydrate();
    expect(useCatalogStore.getState().getArtistById('7')?.artistName).toBe('Aurora Skye');
    expect(useCatalogStore.getState().users).toHaveLength(1);
  });

  it('sorts popular songs by stream count', () => {
    useCatalogStore.setState({
      songs: [
        { ...apiSong, id: 1, streams: 5 },
        { ...apiSong, id: 2, streams: 90 },
      ] as never,
    });
    expect(useCatalogStore.getState().popularSongs(2)[0].streams).toBe(90);
  });

  it('unfollows with DELETE when already following', async () => {
    signIn();
    useAuthStore.setState({
      currentUser: { id: '1', followingIds: ['7'], followerIds: [] } as never,
    });
    const { calls } = mockApi({
      'DELETE /users/7/follow/': { body: { status: 'unfollowed' } },
      'GET /auth/me/': { body: apiUser },
      'GET /users/7/': { body: { ...apiUser, id: 7 } },
    });

    await useCatalogStore.getState().toggleFollow('7');
    expect(calls[0]).toMatchObject({ method: 'DELETE', path: '/users/7/follow/' });
  });

  it('uploads a track as multipart and prepends it', async () => {
    signIn();
    const { calls } = mockApi({ 'POST /songs/': { status: 201, body: apiSong } });
    const song = await useCatalogStore.getState().addSong({
      title: 'Horizon',
      genre: 'Dream Pop',
      audio: new File(['x'], 'horizon.mp3', { type: 'audio/mpeg' }),
    });
    expect(calls[0].body).toMatchObject({ title: 'Horizon', genre: 'Dream Pop' });
    expect(song.id).toBe('5');
    expect(useCatalogStore.getState().songs).toHaveLength(1);
  });

  it('sends a verification decision for an artist', async () => {
    signIn();
    const { calls } = mockApi({ 'POST /users/7/verify/': { body: { ...apiUser, id: 7 } } });
    await useCatalogStore.getState().verifyArtist('7', 'reject', 'Not enough material');
    expect(calls[0].body).toEqual({ decision: 'reject', reason: 'Not enough material' });
  });
});
