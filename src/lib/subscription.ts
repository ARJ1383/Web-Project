import type { SubscriptionTier } from '@/types/models';

/**
 * Subscription-tier rules (PDF "جدول ۱").
 *
 * The backend owns the real numbers — `applyPlans` replaces the defaults below
 * with the plans fetched from `/api/subscription-plans/`, so an admin changing
 * a price or a limit never requires a code change. The defaults only cover the
 * moment before the first fetch resolves.
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
  /** Monthly price in the currency below. */
  monthlyPrice: number;
  currency: string;
}

export interface ApiPlan {
  id: number;
  code: SubscriptionTier;
  name: string;
  monthly_price: string;
  currency: string;
  max_playlists: number | null;
  daily_stream_limit: number | null;
  can_upload_avatar: boolean;
  can_download: boolean;
  early_access: boolean;
  can_see_stats: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Plan extends TierCapabilities {
  id: string;
  code: SubscriptionTier;
  name: string;
}

export const TIER_CAPABILITIES: Record<SubscriptionTier, TierCapabilities> = {
  basic: {
    maxPlaylists: 6,
    dailyStreamLimit: 60,
    canUploadAvatar: false,
    canDownload: false,
    earlyAccess: false,
    canSeeStats: false,
    monthlyPrice: 0,
    currency: 'تومان',
  },
  silver: {
    maxPlaylists: 100,
    dailyStreamLimit: Infinity,
    canUploadAvatar: true,
    canDownload: true,
    earlyAccess: false,
    canSeeStats: false,
    monthlyPrice: 129_000,
    currency: 'تومان',
  },
  gold: {
    maxPlaylists: Infinity,
    dailyStreamLimit: Infinity,
    canUploadAvatar: true,
    canDownload: true,
    earlyAccess: true,
    canSeeStats: true,
    monthlyPrice: 199_000,
    currency: 'تومان',
  },
};

export const TIER_ORDER: SubscriptionTier[] = ['basic', 'silver', 'gold'];

/** Overwrites the local defaults with the plans the backend returned. */
export function applyPlans(plans: ApiPlan[]): Plan[] {
  return plans.map((plan) => {
    const capabilities: TierCapabilities = {
      maxPlaylists: plan.max_playlists ?? Infinity,
      dailyStreamLimit: plan.daily_stream_limit ?? Infinity,
      canUploadAvatar: plan.can_upload_avatar,
      canDownload: plan.can_download,
      earlyAccess: plan.early_access,
      canSeeStats: plan.can_see_stats,
      monthlyPrice: Number(plan.monthly_price),
      currency: plan.currency,
    };
    TIER_CAPABILITIES[plan.code] = capabilities;
    return { ...capabilities, id: String(plan.id), code: plan.code, name: plan.name };
  });
}

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
