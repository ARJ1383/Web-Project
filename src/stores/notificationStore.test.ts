import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';
import { setTokens } from '@/lib/api';
import { mockApi, paginated, signIn } from '@/test/api-mock';

const unread = {
  id: 11,
  type: 'new_release' as const,
  title: 'A new song',
  body: 'Aurora Skye released Horizon.',
  link: '/artist/7',
  read: false,
  created_at: '2026-06-01T10:00:00Z',
};
const readItem = { ...unread, id: 12, title: 'Older', read: true };

beforeEach(() => {
  vi.unstubAllGlobals();
  setTokens(null);
  signIn();
  useNotificationStore.setState({ notifications: [] });
  useAuthStore.setState({ currentUser: { id: '1' } as never, ready: true });
});

describe('notificationStore', () => {
  it('hydrates the notifications of the signed-in account', async () => {
    mockApi({ 'GET /notifications/': { body: paginated([unread, readItem]) } });
    await useNotificationStore.getState().hydrate();
    const items = useNotificationStore.getState().notifications;
    expect(items).toHaveLength(2);
    expect(items[0].userId).toBe('1');
    expect(items[0].link).toBe('/artist/7');
  });

  it('counts the unread ones', async () => {
    mockApi({ 'GET /notifications/': { body: paginated([unread, readItem]) } });
    await useNotificationStore.getState().hydrate();
    expect(useNotificationStore.getState().unreadCount()).toBe(1);
  });

  it('stays empty when nobody is signed in', async () => {
    useAuthStore.setState({ currentUser: null });
    mockApi({});
    await useNotificationStore.getState().hydrate();
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('marks a single notification read', async () => {
    useNotificationStore.setState({ notifications: [{ id: '11', read: false } as never] });
    const { calls } = mockApi({ 'PATCH /notifications/11/': { body: { ...unread, read: true } } });
    await useNotificationStore.getState().markRead('11');
    expect(calls[0].body).toEqual({ read: true });
    expect(useNotificationStore.getState().unreadCount()).toBe(0);
  });

  it('marks everything read in one call', async () => {
    useNotificationStore.setState({
      notifications: [{ id: '11', read: false } as never, { id: '12', read: false } as never],
    });
    const { calls } = mockApi({ 'POST /notifications/mark-all-read/': { body: { updated: 2 } } });
    await useNotificationStore.getState().markAllRead();
    expect(calls[0].path).toBe('/notifications/mark-all-read/');
    expect(useNotificationStore.getState().unreadCount()).toBe(0);
  });

  it('deletes a notification', async () => {
    useNotificationStore.setState({ notifications: [{ id: '11', read: true } as never] });
    mockApi({ 'DELETE /notifications/11/': { status: 204 } });
    await useNotificationStore.getState().remove('11');
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});
