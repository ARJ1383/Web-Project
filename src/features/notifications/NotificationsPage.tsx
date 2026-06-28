import { useTranslation } from 'react-i18next';
import { BellOff, CheckCheck } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationCard } from '@/components/common/NotificationCard';
import { Button, EmptyState } from '@/components/ui';

export function NotificationsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const getByUser = useNotificationStore((s) => s.getByUser);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  if (!user) return null;

  const items = getByUser(user.id);
  const unread = unreadCount(user.id);

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
            <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
          ))}
        </div>
      ) : (
        <EmptyState icon={BellOff} title={t('notifications.empty')} />
      )}
    </div>
  );
}
