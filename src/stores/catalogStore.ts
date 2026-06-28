import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, zustandStorage } from '@/lib/storage';
import { buildSeedDatabase } from '@/lib/seed';
import type { Album, Artist, Song, User } from '@/types/models';

interface CatalogState {
  users: User[];
  artists: Artist[];
  songs: Song[];
  albums: Album[];

  // reads
  getUserById: (id: string) => User | Artist | undefined;
  getArtistById: (id: string) => Artist | undefined;
  getSongById: (id: string) => Song | undefined;
  getAlbumById: (id: string) => Album | undefined;
  getSongsByArtist: (artistId: string) => Song[];
  getAlbumsByArtist: (artistId: string) => Album[];
  popularSongs: (limit?: number) => Song[];
  latestAlbums: (limit?: number) => Album[];
  findByEmail: (email: string) => User | Artist | undefined;

  // writes
  addUser: (user: User) => void;
  addArtist: (artist: Artist) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  removeUser: (id: string) => void;
  toggleFollow: (currentUserId: string, targetId: string) => void;
}

const seed = buildSeedDatabase();

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      users: seed.users,
      artists: seed.artists,
      songs: seed.songs,
      albums: seed.albums,

      getUserById: (id) =>
        get().users.find((u) => u.id === id) ?? get().artists.find((a) => a.id === id),
      getArtistById: (id) => get().artists.find((a) => a.id === id),
      getSongById: (id) => get().songs.find((s) => s.id === id),
      getAlbumById: (id) => get().albums.find((a) => a.id === id),
      getSongsByArtist: (artistId) => get().songs.filter((s) => s.artistId === artistId),
      getAlbumsByArtist: (artistId) => get().albums.filter((a) => a.artistId === artistId),
      popularSongs: (limit = 8) =>
        [...get().songs].sort((a, b) => b.streams - a.streams).slice(0, limit),
      latestAlbums: (limit = 8) =>
        [...get().albums]
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, limit),
      findByEmail: (email) => {
        const e = email.trim().toLowerCase();
        return (
          get().users.find((u) => u.email.toLowerCase() === e) ??
          get().artists.find((a) => a.email.toLowerCase() === e)
        );
      },

      addUser: (user) => set((s) => ({ users: [...s.users, user] })),
      addArtist: (artist) => set((s) => ({ artists: [...s.artists, artist] })),
      updateUser: (id, patch) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          artists: s.artists.map((a) => (a.id === id ? ({ ...a, ...patch } as Artist) : a)),
        })),
      removeUser: (id) =>
        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
          artists: s.artists.filter((a) => a.id !== id),
        })),
      toggleFollow: (currentUserId, targetId) =>
        set((s) => {
          const apply = <T extends User>(list: T[]): T[] =>
            list.map((u) => {
              if (u.id === currentUserId) {
                const has = u.followingIds.includes(targetId);
                return {
                  ...u,
                  followingIds: has
                    ? u.followingIds.filter((id) => id !== targetId)
                    : [...u.followingIds, targetId],
                };
              }
              if (u.id === targetId) {
                const has = u.followerIds.includes(currentUserId);
                return {
                  ...u,
                  followerIds: has
                    ? u.followerIds.filter((id) => id !== currentUserId)
                    : [...u.followerIds, currentUserId],
                };
              }
              return u;
            });
          return { users: apply(s.users), artists: apply(s.artists) };
        }),
    }),
    {
      name: STORAGE_KEYS.db,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({
        users: s.users,
        artists: s.artists,
        songs: s.songs,
        albums: s.albums,
      }),
    },
  ),
);
