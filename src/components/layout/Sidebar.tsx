import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music4 } from 'lucide-react';
import { visibleNavItems } from './navItems';
import { useCurrentUser } from '@/stores/authStore';
import { cn } from '@/lib/cn';

export function Sidebar() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const items = visibleNavItems(user?.role ?? 'listener');

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-2 border-e border-border bg-surface p-4 md:flex">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="rounded-xl bg-accent p-2 text-white shadow-glow-sm">
          <Music4 size={20} />
        </span>
        <span className="text-xl font-extrabold tracking-tight text-text">{t('app.name')}</span>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:bg-surface-2 hover:text-text',
              )
            }
          >
            <Icon size={18} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
