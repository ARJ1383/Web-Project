import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, zustandStorage } from '@/lib/storage';
import { buildSeedPlaylists } from '@/lib/seed';
import { uid } from '@/lib/format';
import { canCreatePlaylist } from '@/lib/subscription';
import type { Playlist, SubscriptionTier } from '@/types/models';

interface PlaylistState {
  playlists: Playlist[];
  getByOwner: (ownerId: string) => Playlist[];
  getById: (id: string) => Playlist | undefined;
  /** Creates a playlist if the tier limit allows; returns the new playlist or null. */
  create: (ownerId: string, tier: SubscriptionTier, name: string) => Playlist | null;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  addSong: (playlistId: string, songId: string) => void;
  removeSong: (playlistId: string, songId: string) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: buildSeedPlaylists(),

      getByOwner: (ownerId) => get().playlists.filter((p) => p.ownerId === ownerId),
      getById: (id) => get().playlists.find((p) => p.id === id),

      create: (ownerId, tier, name) => {
        const count = get().getByOwner(ownerId).length;
        if (!canCreatePlaylist(tier, count)) return null;
        const now = new Date().toISOString();
        const playlist: Playlist = {
          id: uid('pl'),
          name: name.trim(),
          ownerId,
          coverUrl: null,
          songIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ playlists: [...s.playlists, playlist] }));
        return playlist;
      },

      rename: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...p, name: name.trim(), updatedAt: new Date().toISOString() } : p,
          ),
        })),

      remove: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      addSong: (playlistId, songId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.songIds.includes(songId)
              ? { ...p, songIds: [...p.songIds, songId], updatedAt: new Date().toISOString() }
              : p,
          ),
        })),

      removeSong: (playlistId, songId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  songIds: p.songIds.filter((id) => id !== songId),
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        })),
    }),
    {
      name: STORAGE_KEYS.playlists,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
