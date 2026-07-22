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
  updateArtist: (id: string, patch: Partial<Artist>) => void;
  removeUser: (id: string) => void;
  toggleFollow: (currentUserId: string, targetId: string) => void;

  addSong: (song: Song) => void;
  updateSong: (id: string, patch: Partial<Song>) => void;
  deleteSong: (id: string) => void;

  addAlbum: (album: Album) => void;
  updateAlbum: (id: string, patch: Partial<Album>) => void;
  deleteAlbum: (id: string) => void;

  addSongToAlbum: (songId: string, albumId: string) => void;

  removeSongFromAlbum: (songId: string, albumId: string) => void;
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
      updateArtist: (id, patch) =>
        set((s) => ({
          artists: s.artists.map((a) => (a.id === id ? ({ ...a, ...patch } as Artist) : a)),
          users: s.users.map((u) => (u.id === id ? ({ ...u, ...patch } as User) : u)),
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

      addSong: (song) =>
        set((s) => ({
          songs: [...s.songs, song],
        })),

      updateSong: (id, patch) =>
        set((s) => ({
          songs: s.songs.map((song) => (song.id === id ? { ...song, ...patch } : song)),
        })),

      deleteSong: (id) =>
        set((s) => ({
          songs: s.songs.filter((song) => song.id !== id),
        })),

      addAlbum: (album) =>
        set((s) => ({
          albums: [...s.albums, album],
        })),

      updateAlbum: (id, patch) =>
        set((s) => ({
          albums: s.albums.map((album) => (album.id === id ? { ...album, ...patch } : album)),
        })),

      deleteAlbum: (id) =>
        set((s) => ({
          albums: s.albums.filter((album) => album.id !== id),
          songs: s.songs.map((song) =>
            song.albumId === id
              ? {
                  ...song,
                  albumId: null,
                  albumTitle: undefined,
                }
              : song,
          ),
        })),

      addSongToAlbum: (songId, albumId) =>
        set((s) => {
          const album = s.albums.find((a) => a.id === albumId);

          if (!album) return s;

          return {
            songs: s.songs.map((song) =>
              song.id === songId
                ? {
                    ...song,
                    albumId,
                    albumTitle: album.title,
                  }
                : song,
            ),

            albums: s.albums.map((a) =>
              a.id === albumId
                ? {
                    ...a,
                    songIds: [...a.songIds, songId],
                  }
                : a,
            ),
          };
        }),

      removeSongFromAlbum: (songId, albumId) =>
        set((s) => ({
          songs: s.songs.map((song) =>
            song.id === songId
              ? {
                  ...song,
                  albumId: null,
                  albumTitle: undefined,
                }
              : song,
          ),

          albums: s.albums.map((album) =>
            album.id === albumId
              ? {
                  ...album,
                  songIds: album.songIds.filter((id) => id !== songId),
                }
              : album,
          ),
        })),
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
