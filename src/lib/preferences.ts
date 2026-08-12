/**
 * User preferences live on the account, so every device the user signs in from
 * sees the same theme, language, volume and notification limit (PDF §3.5).
 */
import { request } from '@/lib/api';
import { toUser, type ApiUser } from '@/lib/mappers';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import type { UserSettings } from '@/types/models';

const FIELD_MAP: Record<keyof UserSettings, string> = {
  notificationLimit: 'notification_limit',
  volume: 'volume',
  language: 'language',
  theme: 'theme',
};

/** Applies the stored preferences of the signed-in account to the UI. */
export function applyUserSettings(settings: UserSettings): void {
  useThemeStore.getState().setTheme(settings.theme);
  useLanguageStore.getState().setLanguage(settings.language);
  usePlayerStore.getState().setVolume(settings.volume);
}

/** Saves a preference change and keeps the cached account in sync. */
export async function saveSettings(patch: Partial<UserSettings>): Promise<void> {
  const body = Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [FIELD_MAP[key as keyof UserSettings], value]),
  );
  const data = await request<ApiUser>('/auth/me/', { method: 'PATCH', body });
  useAuthStore.getState().setCurrentUser(toUser(data));
}
