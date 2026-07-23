import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, zustandStorage } from '@/lib/storage';
import { buildSeedDatabase } from '@/lib/seed';
import type { AppNotification } from '@/types/models';

interface NotificationState {
  notifications: AppNotification[];
  getByUser: (userId: string) => AppNotification[];
  unreadCount: (userId: string) => number;
  markRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  remove: (id: string) => void;
  add: (notification: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: buildSeedDatabase().notifications,

      getByUser: (userId) =>
        get()
          .notifications.filter((n) => n.userId === userId)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),

      unreadCount: (userId) =>
        get().notifications.filter((n) => n.userId === userId && !n.read).length,

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: (userId) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        })),

      remove: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      add: (notification) => set((s) => ({ notifications: [notification, ...s.notifications] })),
    }),
    {
      name: STORAGE_KEYS.notifications,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
