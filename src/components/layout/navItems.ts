import { Home, ListMusic, Disc3, User, Settings, LayoutDashboard, Mic2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/types/models';

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  /** If set, only these roles see the item. */
  roles?: Role[];
}

/** Primary navigation shared by the sidebar (desktop) and bottom nav (mobile). */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: Home },
  { to: '/albums', labelKey: 'nav.albums', icon: Disc3 },
  { to: '/playlists', labelKey: 'nav.playlists', icon: ListMusic },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
  { to: '/studio', labelKey: 'nav.studio', icon: Mic2, roles: ['artist'] },
  {
    to: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    roles: ['support', 'admin'],
  },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function visibleNavItems(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
