import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { PlayerBarSlot } from './PlayerBarSlot';
import { AudioController } from '@/features/player/AudioController';
import { useAuthStore } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePlayerStore } from '@/stores/playerStore';

/** Authenticated app shell: sidebar (desktop) / bottom nav (mobile) + player slot. */
export function AppLayout() {
  const userId = useAuthStore((s) => s.currentUserId);

  // The saved "system volume" (Settings) seeds the player on sign-in.
  useEffect(() => {
    if (!userId) return;
    const user = useCatalogStore.getState().getUserById(userId);
    if (user) usePlayerStore.getState().setVolume(user.settings.volume);
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
