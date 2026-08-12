import { create } from 'zustand';
import { ApiError, getTokens, request, setTokens } from '@/lib/api';
import { toUser, type ApiUser } from '@/lib/mappers';
import type { Artist, Gender, User } from '@/types/models';

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate?: string;
  gender?: Gender;
}

export interface ArtistRegisterInput {
  artistName: string;
  email: string;
  password: string;
  confirmPassword: string;
  portfolioUrl?: string;
}

export type AuthResult = { ok: true; user: User | Artist } | { ok: false; error: string };

interface AuthPayload {
  user: ApiUser;
  tokens: { access: string; refresh: string };
}

interface AuthState {
  currentUser: User | Artist | null;
  /** False until the stored session has been checked against the API. */
  ready: boolean;
  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  registerArtist: (input: ArtistRegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  /** Replaces the cached account after a profile or subscription change. */
  setCurrentUser: (user: User | Artist | null) => void;
  refreshCurrentUser: () => Promise<void>;
}

function failure(error: unknown, fallback: string): AuthResult {
  if (error instanceof ApiError) return { ok: false, error: error.message || fallback };
  return { ok: false, error: fallback };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUser: null,
  ready: false,

  restore: async () => {
    if (!getTokens()) {
      set({ ready: true });
      return;
    }
    try {
      const data = await request<ApiUser>('/auth/me/');
      set({ currentUser: toUser(data), ready: true });
    } catch {
      setTokens(null);
      set({ currentUser: null, ready: true });
    }
  },

  login: async (email, password) => {
    try {
      const data = await request<AuthPayload>('/auth/login/', {
        method: 'POST',
        body: { email, password },
        anonymous: true,
      });
      setTokens(data.tokens);
      const user = toUser(data.user);
      set({ currentUser: user, ready: true });
      return { ok: true, user };
    } catch (error) {
      return failure(error, 'auth.invalidCredentials');
    }
  },

  register: async (input) => {
    try {
      const data = await request<AuthPayload>('/auth/register/', {
        method: 'POST',
        anonymous: true,
        body: {
          email: input.email,
          password: input.password,
          confirm_password: input.confirmPassword,
          display_name: input.displayName,
          birth_date: input.birthDate || null,
          gender: input.gender,
        },
      });
      setTokens(data.tokens);
      const user = toUser(data.user);
      set({ currentUser: user, ready: true });
      return { ok: true, user };
    } catch (error) {
      return failure(error, 'auth.emailTaken');
    }
  },

  registerArtist: async (input) => {
    try {
      const data = await request<AuthPayload>('/auth/artist-register/', {
        method: 'POST',
        anonymous: true,
        body: {
          email: input.email,
          password: input.password,
          confirm_password: input.confirmPassword,
          artist_name: input.artistName,
          portfolio_url: input.portfolioUrl || '',
        },
      });
      setTokens(data.tokens);
      const user = toUser(data.user);
      set({ currentUser: user, ready: true });
      return { ok: true, user };
    } catch (error) {
      return failure(error, 'auth.emailTaken');
    }
  },

  logout: async () => {
    const refresh = getTokens()?.refresh;
    if (refresh) {
      await request('/auth/logout/', { method: 'POST', body: { refresh } }).catch(() => undefined);
    }
    setTokens(null);
    set({ currentUser: null });
  },

  deleteAccount: async () => {
    await request('/auth/me/', { method: 'DELETE' });
    setTokens(null);
    set({ currentUser: null });
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  refreshCurrentUser: async () => {
    if (!get().currentUser) return;
    const data = await request<ApiUser>('/auth/me/');
    set({ currentUser: toUser(data) });
  },
}));

/** The currently authenticated account (reactive). */
export function useCurrentUser(): User | Artist | null {
  return useAuthStore((s) => s.currentUser);
}
