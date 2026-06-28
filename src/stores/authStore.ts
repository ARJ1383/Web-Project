import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, zustandStorage } from '@/lib/storage';
import { useCatalogStore } from './catalogStore';
import { generateUsername, uid } from '@/lib/format';
import type { Artist, Gender, User } from '@/types/models';

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  birthDate?: string;
  gender?: Gender;
}

export interface ArtistRegisterInput {
  artistName: string;
  email: string;
  password: string;
  portfolioUrl?: string;
}

export type AuthResult = { ok: true; user: User | Artist } | { ok: false; error: string };

interface AuthState {
  currentUserId: string | null;
  login: (email: string, password: string) => AuthResult;
  register: (input: RegisterInput) => AuthResult;
  registerArtist: (input: ArtistRegisterInput) => AuthResult;
  logout: () => void;
  deleteAccount: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUserId: null,

      login: (email, password) => {
        const found = useCatalogStore.getState().findByEmail(email);
        if (!found || found.password !== password) {
          return { ok: false, error: 'auth.invalidCredentials' };
        }
        set({ currentUserId: found.id });
        return { ok: true, user: found };
      },

      register: (input) => {
        const catalog = useCatalogStore.getState();
        if (catalog.findByEmail(input.email)) {
          return { ok: false, error: 'auth.emailTaken' };
        }
        const user: User = {
          id: uid('user'),
          role: 'listener',
          email: input.email,
          password: input.password,
          username: generateUsername(input.displayName),
          displayName: input.displayName,
          avatarUrl: null,
          birthDate: input.birthDate,
          gender: input.gender,
          subscription: { tier: 'basic', expiresAt: null },
          settings: { notificationLimit: 50, volume: 70, language: 'fa' },
          followerIds: [],
          followingIds: [],
          dailyStreamCount: 0,
          createdAt: new Date().toISOString(),
        };
        catalog.addUser(user);
        set({ currentUserId: user.id });
        return { ok: true, user };
      },

      registerArtist: (input) => {
        const catalog = useCatalogStore.getState();
        if (catalog.findByEmail(input.email)) {
          return { ok: false, error: 'auth.emailTaken' };
        }
        const artist: Artist = {
          id: uid('artist'),
          role: 'artist',
          email: input.email,
          password: input.password,
          username: generateUsername(input.artistName),
          displayName: input.artistName,
          artistName: input.artistName,
          avatarUrl: null,
          status: 'pending',
          verified: false,
          portfolioUrl: input.portfolioUrl,
          subscription: { tier: 'basic', expiresAt: null },
          settings: { notificationLimit: 50, volume: 70, language: 'fa' },
          followerIds: [],
          followingIds: [],
          dailyStreamCount: 0,
          totalListeners: 0,
          totalStreams: 0,
          albumIds: [],
          songIds: [],
          createdAt: new Date().toISOString(),
        };
        catalog.addArtist(artist);
        set({ currentUserId: artist.id });
        return { ok: true, user: artist };
      },

      logout: () => set({ currentUserId: null }),

      deleteAccount: () => {
        const id = get().currentUserId;
        if (id) useCatalogStore.getState().removeUser(id);
        set({ currentUserId: null });
      },
    }),
    {
      name: STORAGE_KEYS.auth,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

/** Convenience selector for the currently authenticated user (reactive). */
export function useCurrentUser(): User | Artist | null {
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const users = useCatalogStore((s) => s.users);
  const artists = useCatalogStore((s) => s.artists);
  if (!currentUserId) return null;
  return (
    users.find((u) => u.id === currentUserId) ?? artists.find((a) => a.id === currentUserId) ?? null
  );
}
