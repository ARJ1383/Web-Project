import { create } from 'zustand';
import { request, requestAll } from '@/lib/api';
import { toNotification, type ApiNotification } from '@/lib/mappers';
import { useAuthStore } from './authStore';
import type { AppNotification } from '@/types/models';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: () => number;
  hydrate: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  hydrate: async () => {
    const userId = useAuthStore.getState().currentUser?.id;
    if (!userId) {
      set({ notifications: [] });
      return;
    }
    const data = await requestAll<ApiNotification>('/notifications/');
    set({ notifications: data.map((item) => toNotification(item, userId)) });
  },

  markRead: async (id) => {
    await request(`/notifications/${id}/`, { method: 'PATCH', body: { read: true } });
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllRead: async () => {
    await request('/notifications/mark-all-read/', { method: 'POST' });
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },

  remove: async (id) => {
    await request(`/notifications/${id}/`, { method: 'DELETE' });
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },
}));
