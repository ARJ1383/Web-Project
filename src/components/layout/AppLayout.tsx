import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { PlayerBarSlot } from './PlayerBarSlot';
import { AudioController } from '@/features/player/AudioController';
import i18n from '@/i18n';
import { useAuthStore, useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import { applyUserSettings } from '@/lib/preferences';
import { toast } from '@/stores/toastStore';

/** Authenticated app shell: sidebar (desktop) / bottom nav (mobile) + player slot. */
export function AppLayout() {
  const userId = useCurrentUser()?.id;

  // Load everything the shell and its pages read, once per signed-in account,
  // and apply the preferences stored on that account.
  useEffect(() => {
    const user = useAuthStore.getState().currentUser;
    if (!userId || !user) return;
    applyUserSettings(user.settings);
    void Promise.all([
      useCatalogStore.getState().hydrate(),
      usePlaylistStore.getState().hydrate(),
      useNotificationStore.getState().hydrate(),
    ]).catch(() => toast.error(i18n.t('common.error')));
  }, [userId]);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 pb-40 pt-4 md:pb-24">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
      <AudioController />
      <PlayerBarSlot />
    </div>
  );
}
