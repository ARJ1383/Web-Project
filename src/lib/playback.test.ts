import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startPlayback } from './playback';
import { setTokens } from '@/lib/api';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useAuthStore } from '@/stores/authStore';
import { mockApi, signIn } from '@/test/api-mock';

beforeEach(() => {
  vi.unstubAllGlobals();
  setTokens(null);
  signIn();
  useCatalogStore.setState({
    songs: [{ id: '5', title: 'Horizon', streams: 100, listeners: 10 } as never],
  });
  usePlayerStore.setState({ currentSongId: null, queue: [], playing: false });
  useAuthStore.setState({
    currentUser: { id: '1', dailyStreamCount: 0 } as never,
    ready: true,
  });
});

describe('startPlayback (daily stream limit, PDF جدول ۱)', () => {
  it('plays when the backend accepts the stream and applies the new counters', async () => {
    mockApi({
      'POST /songs/5/play/': {
        body: { streams_count: 101, listeners_count: 11, daily_stream_count: 1 },
      },
    });

    await expect(startPlayback('5', ['5'])).resolves.toBe(true);
    expect(usePlayerStore.getState().currentSongId).toBe('5');
    expect(useCatalogStore.getState().getSongById('5')?.streams).toBe(101);
    expect(useAuthStore.getState().currentUser?.dailyStreamCount).toBe(1);
  });

  it('refuses to play when the daily quota is exhausted', async () => {
    mockApi({
      'POST /songs/5/play/': {
        status: 429,
        body: { detail: 'Daily stream limit reached.', limit: 60 },
      },
    });

    await expect(startPlayback('5')).resolves.toBe(false);
    expect(usePlayerStore.getState().currentSongId).toBeNull();
  });

  it('does not start playback when the request fails', async () => {
    mockApi({ 'POST /songs/5/play/': { status: 500, body: { detail: 'boom' } } });
    await expect(startPlayback('5')).resolves.toBe(false);
    expect(usePlayerStore.getState().playing).toBe(false);
  });
});
