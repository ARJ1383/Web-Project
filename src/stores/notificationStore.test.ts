import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from './notificationStore';
import { buildSeedDatabase } from '@/lib/seed';

beforeEach(() => {
  useNotificationStore.setState({ notifications: buildSeedDatabase().notifications });
});

describe('notificationStore', () => {
  it('returns notifications for a user, newest first', () => {
    const items = useNotificationStore.getState().getByUser('user_sara');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((n) => n.userId === 'user_sara')).toBe(true);
  });

  it('counts unread notifications per user', () => {
    expect(useNotificationStore.getState().unreadCount('user_sara')).toBe(1);
  });

  it('marks a single notification as read', () => {
    useNotificationStore.getState().markRead('ntf_1');
    expect(useNotificationStore.getState().unreadCount('user_sara')).toBe(0);
  });

  it('marks all of a user notifications as read', () => {
    expect(useNotificationStore.getState().unreadCount('support_reza')).toBe(2);
    useNotificationStore.getState().markAllRead('support_reza');
    expect(useNotificationStore.getState().unreadCount('support_reza')).toBe(0);
  });

  it('deletes a notification', () => {
    const before = useNotificationStore.getState().getByUser('user_sara').length;
    useNotificationStore.getState().remove('ntf_1');
    const after = useNotificationStore.getState().getByUser('user_sara');
    expect(after.length).toBe(before - 1);
    expect(after.some((n) => n.id === 'ntf_1')).toBe(false);
  });
});
