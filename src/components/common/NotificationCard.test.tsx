import { describe, it, expect, vi } from 'vitest';
import { renderWithRouter, screen, userEvent } from '@/test/test-utils';
import i18n from '@/i18n';
import { NotificationCard } from './NotificationCard';
import type { AppNotification } from '@/types/models';

const unread: AppNotification = {
  id: 'n1',
  userId: 'u1',
  type: 'monthly_payout',
  title: 'Payout',
  body: 'Your payout is ready',
  read: false,
  createdAt: new Date().toISOString(),
};

const markReadLabel = () => i18n.t('notifications.markAsRead');
const deleteLabel = () => i18n.t('notifications.deleteNotification');

describe('NotificationCard', () => {
  it('shows a mark-as-read control for unread notifications', () => {
    renderWithRouter(
      <NotificationCard notification={unread} onMarkRead={() => {}} onRemove={() => {}} />,
    );
    expect(screen.getByText('Payout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: markReadLabel() })).toBeInTheDocument();
  });

  it('calls onMarkRead with the notification id', async () => {
    const onMarkRead = vi.fn();
    renderWithRouter(
      <NotificationCard notification={unread} onMarkRead={onMarkRead} onRemove={() => {}} />,
    );
    await userEvent.click(screen.getByRole('button', { name: markReadLabel() }));
    expect(onMarkRead).toHaveBeenCalledWith('n1');
  });

  it('calls onRemove with the notification id (PDF: حذف اعلان)', async () => {
    const onRemove = vi.fn();
    renderWithRouter(
      <NotificationCard notification={unread} onMarkRead={() => {}} onRemove={onRemove} />,
    );
    await userEvent.click(screen.getByRole('button', { name: deleteLabel() }));
    expect(onRemove).toHaveBeenCalledWith('n1');
  });

  it('hides the mark-as-read control once read but keeps delete', () => {
    renderWithRouter(
      <NotificationCard
        notification={{ ...unread, read: true }}
        onMarkRead={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: markReadLabel() })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: deleteLabel() })).toBeInTheDocument();
  });
});
