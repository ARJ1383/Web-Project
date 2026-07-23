/**
 * Playback entry point that enforces the tier rules from PDF جدول ۱.
 *
 * All "play this song" actions in the UI go through `startPlayback` so the
 * basic-tier daily stream limit is checked (and counted) in exactly one place.
 */
import i18n from '@/i18n';
import { toast } from '@/stores/toastStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useAuthStore } from '@/stores/authStore';
import { getCapabilities } from '@/lib/subscription';

/** Local calendar day (YYYY-MM-DD) used to reset the daily counter. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Start playing `songId` (optionally with an explicit queue).
 * Returns `false` when the user's daily stream limit is exhausted.
 */
export function startPlayback(songId: string, queue?: string[]): boolean {
  const auth = useAuthStore.getState();
  const catalog = useCatalogStore.getState();
  const user = auth.currentUserId ? catalog.getUserById(auth.currentUserId) : undefined;

  if (user) {
    const limit = getCapabilities(user.subscription.tier).dailyStreamLimit;
    const count = user.lastStreamDate === today() ? user.dailyStreamCount : 0;

    if (count >= limit) {
      toast.error(i18n.t('player.dailyLimitReached', { limit }));
      return false;
    }

    catalog.updateUser(user.id, { dailyStreamCount: count + 1, lastStreamDate: today() });
  }

  usePlayerStore.getState().playSong(songId, queue);
  return true;
}
