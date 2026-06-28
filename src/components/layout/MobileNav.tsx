import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { visibleNavItems } from './navItems';
import { useCurrentUser } from '@/stores/authStore';
import { cn } from '@/lib/cn';

/** Bottom navigation for small screens (sits above the player slot). */
export function MobileNav() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const items = visibleNavItems(user?.role ?? 'listener').slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-16 z-40 flex items-center justify-around border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur md:hidden">
      {items.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-accent' : 'text-muted',
            )
          }
        >
          <Icon size={20} />
          <span className="truncate">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
