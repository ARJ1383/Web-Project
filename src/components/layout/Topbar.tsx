import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Moon, Sun, Languages, LogOut } from 'lucide-react';
import { useCurrentUser, useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { saveSettings } from '@/lib/preferences';
import { useNotificationStore } from '@/stores/notificationStore';
import { Avatar, Button } from '@/components/ui';

export function Topbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

  // Preferences are part of the account, so a toggle is also saved server-side.
  const switchTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    void saveSettings({ theme: next });
  };
  const switchLanguage = () => {
    const next = language === 'fa' ? 'en' : 'fa';
    setLanguage(next);
    void saveSettings({ language: next });
  };
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <Avatar src={user.avatarUrl} alt={user.displayName} size={36} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-text">
            {t('home.greeting', { name: user.displayName })}
          </p>
          <p className="text-xs text-muted">{user.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={switchLanguage}
          aria-label={t('settings.language')}
        >
          <Languages size={18} />
          <span className="sr-only">{language}</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={switchTheme} aria-label={t('settings.theme')}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Link
          to="/notifications"
          aria-label={t('nav.notifications')}
          className="relative rounded-xl p-2.5 text-text transition-colors hover:bg-surface-2"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute end-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            void logout().then(() => navigate('/login'));
          }}
          aria-label={t('nav.logout')}
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
