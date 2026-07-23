import { useTranslation } from 'react-i18next';
import { BellOff, CheckCheck } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationCard } from '@/components/common/NotificationCard';
import { Button, EmptyState } from '@/components/ui';

export function NotificationsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  // Subscribe to the array itself so mark-read / delete re-render this page.
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);

  if (!user) return null;

  const mine = notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  // Respect the "max notifications" preference from Settings.
  const items = mine.slice(0, user.settings.notificationLimit);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-text">{t('notifications.title')}</h1>
          {unread > 0 && (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
              {t('notifications.unreadCount', { count: unread })}
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead(user.id)}>
            <CheckCheck size={16} />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={markRead} onRemove={remove} />
          ))}
        </div>
      ) : (
        <EmptyState icon={BellOff} title={t('notifications.empty')} />
      )}
    </div>
  );
}
