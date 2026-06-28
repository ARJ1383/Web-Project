import { describe, it, expect, vi } from 'vitest';
import { renderWithRouter, screen, userEvent } from '@/test/test-utils';
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

describe('NotificationCard', () => {
  it('shows a mark-as-read control for unread notifications', () => {
    renderWithRouter(<NotificationCard notification={unread} onMarkRead={() => {}} />);
    expect(screen.getByText('Payout')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onMarkRead with the notification id', async () => {
    const onMarkRead = vi.fn();
    renderWithRouter(<NotificationCard notification={unread} onMarkRead={onMarkRead} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onMarkRead).toHaveBeenCalledWith('n1');
  });

  it('hides the control once read', () => {
    renderWithRouter(
      <NotificationCard notification={{ ...unread, read: true }} onMarkRead={() => {}} />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
