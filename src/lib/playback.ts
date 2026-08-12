/**
 * Playback entry point.
 *
 * All "play this song" actions in the UI go through `startPlayback`, which asks
 * the backend to count the stream. The daily limit of the user's plan is
 * enforced there (HTTP 429), so the rule lives in exactly one place.
 */
import i18n from '@/i18n';
import { ApiError, request } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useAuthStore } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';

interface PlayResponse {
  streams_count: number;
  listeners_count: number;
  daily_stream_count: number;
}

/**
 * Start playing `songId` (optionally with an explicit queue).
 * Returns `false` when the backend refused the stream.
 */
export async function startPlayback(songId: string, queue?: string[]): Promise<boolean> {
  try {
    const data = await request<PlayResponse>(`/songs/${songId}/play/`, { method: 'POST' });
    useCatalogStore.setState((state) => ({
      songs: state.songs.map((song) =>
        song.id === songId
          ? { ...song, streams: data.streams_count, listeners: data.listeners_count }
          : song,
      ),
    }));
    const user = useAuthStore.getState().currentUser;
    if (user) {
      useAuthStore
        .getState()
        .setCurrentUser({ ...user, dailyStreamCount: data.daily_stream_count });
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      const limit = (error.data as { limit?: number } | null)?.limit ?? 0;
      toast.error(i18n.t('player.dailyLimitReached', { limit }));
      return false;
    }
    toast.error(i18n.t('common.error'));
    return false;
  }

  usePlayerStore.getState().playSong(songId, queue);
  return true;
}
