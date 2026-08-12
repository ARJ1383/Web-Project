import { vi } from 'vitest';
import { setTokens } from '@/lib/api';

export interface MockCall {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

export interface MockRoute {
  status?: number;
  body?: unknown;
}

/**
 * Installs a `fetch` double for the API layer.
 *
 * Routes are keyed by `"<METHOD> <path>"`, e.g. `"POST /auth/login/"`. Every
 * call is recorded so a test can assert on the request the store made.
 */
export function mockApi(routes: Record<string, MockRoute>) {
  const calls: MockCall[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const path = url.pathname.replace(/^\/api/, '');
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const rawBody = init?.body;
    calls.push({
      method,
      path,
      headers,
      body:
        typeof rawBody === 'string'
          ? JSON.parse(rawBody)
          : rawBody instanceof FormData
            ? Object.fromEntries(rawBody.entries())
            : undefined,
    });

    const route = routes[`${method} ${path}`];
    const status = route?.status ?? (route ? 200 : 404);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => route?.body ?? { detail: `No mock for ${method} ${path}` },
    } as Response;
  });

  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

export function paginated<T>(results: T[]) {
  return { count: results.length, next: null, previous: null, results };
}

export function signIn(access = 'access-token', refresh = 'refresh-token') {
  setTokens({ access, refresh });
}

export const apiUser = {
  id: 1,
  email: 'sara@trimir.app',
  username: '@sara',
  display_name: 'Sara',
  role: 'listener' as const,
  avatar: null,
  bio: '',
  birth_date: null,
  gender: 'unspecified' as const,
  subscription_tier: 'gold' as const,
  subscription_expires_at: '2026-12-01T00:00:00Z',
  notification_limit: 50,
  volume: 70,
  language: 'fa' as const,
  theme: 'dark' as const,
  daily_stream_count: 3,
  last_stream_date: null,
  follower_ids: [],
  following_ids: [7],
  artist_profile: null,
  created_at: '2026-01-01T00:00:00Z',
};

export const apiSong = {
  id: 5,
  title: 'Horizon',
  artist_id: 7,
  artist_display_name: 'Aurora Skye',
  album_id: null,
  album_title: null,
  cover: null,
  audio_file: '/media/songs/audio/x.mp3',
  duration_seconds: 32,
  genre: 'Dream Pop',
  release_year: 2025,
  lyrics: '',
  collaborators: [],
  listeners_count: 10,
  streams_count: 100,
  revenue: '420.00',
  is_released: true,
  created_at: '2026-01-01T00:00:00Z',
};
