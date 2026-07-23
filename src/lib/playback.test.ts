import { describe, it, expect, beforeEach } from 'vitest';
import { startPlayback } from './playback';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useAuthStore } from '@/stores/authStore';
import { buildSeedDatabase } from '@/lib/seed';

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  const seed = buildSeedDatabase();
  useCatalogStore.setState({ users: seed.users, artists: seed.artists, songs: seed.songs });
  usePlayerStore.setState({ currentSongId: null, queue: [], playing: false });
  useAuthStore.setState({ currentUserId: 'user_ali' }); // basic tier
});

describe('startPlayback (daily stream limit, PDF جدول ۱)', () => {
  it('plays and counts a stream for a basic user under the limit', () => {
    useCatalogStore
      .getState()
      .updateUser('user_ali', { dailyStreamCount: 0, lastStreamDate: today });
    expect(startPlayback('song_horizon')).toBe(true);
    expect(usePlayerStore.getState().currentSongId).toBe('song_horizon');
    expect(useCatalogStore.getState().getUserById('user_ali')?.dailyStreamCount).toBe(1);
  });

  it('blocks a basic user who exhausted the 60-stream daily quota', () => {
    useCatalogStore
      .getState()
      .updateUser('user_ali', { dailyStreamCount: 60, lastStreamDate: today });
    expect(startPlayback('song_horizon')).toBe(false);
    expect(usePlayerStore.getState().currentSongId).toBeNull();
  });

  it('resets the counter on a new day', () => {
    useCatalogStore
      .getState()
      .updateUser('user_ali', { dailyStreamCount: 60, lastStreamDate: '2020-01-01' });
    expect(startPlayback('song_horizon')).toBe(true);
    expect(useCatalogStore.getState().getUserById('user_ali')?.dailyStreamCount).toBe(1);
  });

  it('never blocks gold users', () => {
    useAuthStore.setState({ currentUserId: 'user_sara' });
    useCatalogStore
      .getState()
      .updateUser('user_sara', { dailyStreamCount: 10_000, lastStreamDate: today });
    expect(startPlayback('song_horizon')).toBe(true);
  });
});
