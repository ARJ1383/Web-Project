import type { SubscriptionTier } from '@/types/models';

/**
 * Single source of truth for the subscription-tier rules (PDF "جدول ۱").
 *
 * UI gates read from here so that changing a limit or price never requires
 * touching component code (PDF note: "قیمت‌گذاری پویا ... نباید نیازی به ایجاد
 * تغییر در کد باشد").
 *
 * `Infinity` represents "unlimited".
 */
export interface TierCapabilities {
  /** Max number of playlists the user may own. */
  maxPlaylists: number;
  /** Max streams per day. */
  dailyStreamLimit: number;
  /** Can set/change a profile avatar. */
  canUploadAvatar: boolean;
  /** Can download songs for offline listening. */
  canDownload: boolean;
  /** Early access to newly released songs. */
  earlyAccess: boolean;
  /** Can see per-song / listener statistics. */
  canSeeStats: boolean;
}

export const TIER_CAPABILITIES: Record<SubscriptionTier, TierCapabilities> = {
  basic: {
    maxPlaylists: 6,
    dailyStreamLimit: 60,
    canUploadAvatar: false,
    canDownload: false,
    earlyAccess: false,
    canSeeStats: false,
  },
  silver: {
    maxPlaylists: 100,
    dailyStreamLimit: Infinity,
    canUploadAvatar: true,
    canDownload: true,
    earlyAccess: false,
    canSeeStats: false,
  },
  gold: {
    maxPlaylists: Infinity,
    dailyStreamLimit: Infinity,
    canUploadAvatar: true,
    canDownload: true,
    earlyAccess: true,
    canSeeStats: true,
  },
};

export const TIER_ORDER: SubscriptionTier[] = ['basic', 'silver', 'gold'];

export function getCapabilities(tier: SubscriptionTier): TierCapabilities {
  return TIER_CAPABILITIES[tier];
}

/** Whether a user on `tier` may create another playlist given current count. */
export function canCreatePlaylist(tier: SubscriptionTier, currentCount: number): boolean {
  return currentCount < TIER_CAPABILITIES[tier].maxPlaylists;
}

/** Human-friendly limit ("∞" for unlimited). */
export function formatLimit(value: number): string {
  return Number.isFinite(value) ? String(value) : '∞';
}
