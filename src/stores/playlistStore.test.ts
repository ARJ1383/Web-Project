import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlaylistStore } from './playlistStore';
import { setTokens } from '@/lib/api';
import { mockApi, paginated, signIn } from '@/test/api-mock';

const apiPlaylist = {
  id: 4,
  name: 'Road Trip',
  description: '',
  is_public: false,
  owner_id: 1,
  cover: null,
  song_ids: [] as number[],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.unstubAllGlobals();
  setTokens(null);
  usePlaylistStore.setState({ playlists: [] });
  signIn();
});

describe('playlistStore', () => {
  it('hydrates the playlists of the signed-in user', async () => {
    mockApi({ 'GET /playlists/': { body: paginated([apiPlaylist]) } });
    await usePlaylistStore.getState().hydrate();
    expect(usePlaylistStore.getState().getByOwner('1')).toHaveLength(1);
  });

  it('creates a playlist', async () => {
    const { calls } = mockApi({ 'POST /playlists/': { status: 201, body: apiPlaylist } });
    const created = await usePlaylistStore.getState().create('Road Trip');
    expect(calls[0].body).toMatchObject({ name: 'Road Trip' });
    expect(created?.name).toBe('Road Trip');
    expect(usePlaylistStore.getState().playlists).toHaveLength(1);
  });

  it('returns null when the plan limit rejects the creation', async () => {
    mockApi({
      'POST /playlists/': { status: 400, body: { detail: 'Playlist limit reached.' } },
    });
    await expect(usePlaylistStore.getState().create('Overflow')).resolves.toBeNull();
  });

  it('renames a playlist', async () => {
    usePlaylistStore.setState({ playlists: [{ ...apiPlaylist, id: '4' } as never] });
    mockApi({ 'PATCH /playlists/4/': { body: { ...apiPlaylist, name: 'New name' } } });
    await usePlaylistStore.getState().rename('4', 'New name');
    expect(usePlaylistStore.getState().getById('4')?.name).toBe('New name');
  });

  it('adds a song through the subresource endpoint', async () => {
    usePlaylistStore.setState({
      playlists: [{ id: '4', name: 'Road Trip', ownerId: '1', songIds: [] } as never],
    });
    const { calls } = mockApi({
      'POST /playlists/4/songs/5/': { status: 201, body: { ...apiPlaylist, song_ids: [5] } },
    });
    await usePlaylistStore.getState().addSong('4', '5');
    expect(calls[0].path).toBe('/playlists/4/songs/5/');
    expect(usePlaylistStore.getState().getById('4')?.songIds).toEqual(['5']);
  });

  it('removes a song and drops it from the cached list', async () => {
    usePlaylistStore.setState({
      playlists: [{ id: '4', name: 'Road Trip', ownerId: '1', songIds: ['5'] } as never],
    });
    mockApi({ 'DELETE /playlists/4/songs/5/': { status: 204 } });
    await usePlaylistStore.getState().removeSong('4', '5');
    expect(usePlaylistStore.getState().getById('4')?.songIds).toEqual([]);
  });

  it('deletes a playlist', async () => {
    usePlaylistStore.setState({ playlists: [{ id: '4', ownerId: '1' } as never] });
    mockApi({ 'DELETE /playlists/4/': { status: 204 } });
    await usePlaylistStore.getState().remove('4');
    expect(usePlaylistStore.getState().playlists).toHaveLength(0);
  });
});
