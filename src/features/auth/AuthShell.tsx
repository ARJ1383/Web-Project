import type { ReactNode } from 'react';
import { Music4 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Moon, Sun, Languages } from 'lucide-react';

/** Centered, branded shell for the login / register screens. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleLanguage } = useLanguageStore();

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute end-4 top-4 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          aria-label={t('settings.language')}
        >
          <Languages size={18} />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('settings.theme')}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>

      <div className="card-surface animate-fade-in z-10 w-full max-w-md p-6 shadow-glow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="rounded-2xl bg-accent p-3 text-white shadow-glow">
            <Music4 size={26} />
          </span>
          <h1 className="text-2xl font-extrabold text-text">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
