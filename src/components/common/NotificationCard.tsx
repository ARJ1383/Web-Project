import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CalendarClock,
  Music2,
  BadgeCheck,
  Wallet,
  Ticket,
  UserPlus,
  Check,
  Trash2,
} from 'lucide-react';
import type { AppNotification, NotificationType } from '@/types/models';
import { useLanguageStore } from '@/stores/languageStore';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';

const typeIcons: Record<NotificationType, typeof Bell> = {
  subscription_expiry: CalendarClock,
  new_release: Music2,
  verification_result: BadgeCheck,
  monthly_payout: Wallet,
  new_ticket: Ticket,
  new_verification_request: UserPlus,
};

export interface NotificationCardProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}

export function NotificationCard({ notification, onMarkRead, onRemove }: NotificationCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useLanguageStore((s) => s.language);
  const Icon = typeIcons[notification.type] ?? Bell;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 transition-colors',
        notification.read
          ? 'border-border bg-surface'
          : 'border-accent/40 bg-accent/10 shadow-glow-sm',
      )}
    >
      <div
        className={cn(
          'mt-0.5 rounded-lg p-2',
          notification.read ? 'bg-surface-2 text-muted' : 'bg-accent/20 text-accent',
        )}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-text">{notification.title}</p>
          {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
        </div>
        <p className="mt-0.5 text-sm text-muted">{notification.body}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-muted">
            {formatRelative(notification.createdAt, language)}
          </span>
          {notification.link && (
            <button
              type="button"
              onClick={() => navigate(notification.link!)}
              className="text-xs font-medium text-accent hover:underline"
            >
              {t('common.view')}
            </button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!notification.read && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkRead(notification.id)}
            aria-label={t('notifications.markAsRead')}
            title={t('notifications.markAsRead')}
          >
            <Check size={16} />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(notification.id)}
          aria-label={t('notifications.deleteNotification')}
          title={t('notifications.deleteNotification')}
        >
          <Trash2 size={16} className="text-danger" />
        </Button>
      </div>
    </div>
  );
}
