import { create } from 'zustand';
import { formData, request, requestAll } from '@/lib/api';
import { toAlbum, toSong, toUser, type ApiAlbum, type ApiSong, type ApiUser } from '@/lib/mappers';
import { applyPlans, type ApiPlan, type Plan } from '@/lib/subscription';
import { useAuthStore } from './authStore';
import type { Album, Artist, Song, User } from '@/types/models';

export interface SongInput {
  title: string;
  genre?: string;
  releaseYear?: number;
  lyrics?: string;
  collaborators?: string[];
  albumId?: string | null;
  cover?: File | null;
  audio?: File | null;
}

export interface AlbumInput {
  title: string;
  genre?: string;
  releaseYear?: number;
  cover?: File | null;
}

interface CatalogState {
  users: User[];
  artists: Artist[];
  songs: Song[];
  albums: Album[];
  plans: Plan[];
  loading: boolean;

  // reads
  getUserById: (id: string) => User | Artist | undefined;
  getArtistById: (id: string) => Artist | undefined;
  getSongById: (id: string) => Song | undefined;
  getAlbumById: (id: string) => Album | undefined;
  getSongsByArtist: (artistId: string) => Song[];
  getAlbumsByArtist: (artistId: string) => Album[];
  popularSongs: (limit?: number) => Song[];
  latestAlbums: (limit?: number) => Album[];

  // writes
  hydrate: () => Promise<void>;
  toggleFollow: (targetId: string) => Promise<void>;
  verifyArtist: (
    artistId: string,
    decision: 'approve' | 'reject',
    reason?: string,
  ) => Promise<void>;

  addSong: (input: SongInput) => Promise<Song>;
  updateSong: (id: string, patch: Partial<SongInput>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;

  addAlbum: (input: AlbumInput) => Promise<Album>;
  updateAlbum: (id: string, patch: Partial<AlbumInput>) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;

  addSongToAlbum: (songId: string, albumId: string) => Promise<void>;
  removeSongFromAlbum: (songId: string) => Promise<void>;
}

function isArtist(user: User | Artist): user is Artist {
  return user.role === 'artist' && 'artistName' in user;
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  users: [],
  artists: [],
  songs: [],
  albums: [],
  plans: [],
  loading: false,

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

  hydrate: async () => {
    set({ loading: true });
    try {
      const [users, songs, albums, plans] = await Promise.all([
        requestAll<ApiUser>('/users/'),
        requestAll<ApiSong>('/songs/'),
        requestAll<ApiAlbum>('/albums/'),
        requestAll<ApiPlan>('/subscription-plans/'),
      ]);
      const accounts = users.map(toUser);
      set({
        users: accounts.filter((account) => !isArtist(account)),
        artists: accounts.filter(isArtist),
        songs: songs.map(toSong),
        albums: albums.map(toAlbum),
        plans: applyPlans(plans),
      });
    } finally {
      set({ loading: false });
    }
  },

  toggleFollow: async (targetId) => {
    const auth = useAuthStore.getState();
    const me = auth.currentUser;
    if (!me) return;
    await request(`/users/${targetId}/follow/`, {
      method: me.followingIds.includes(targetId) ? 'DELETE' : 'POST',
    });
    await auth.refreshCurrentUser();
    const target = toUser(await request<ApiUser>(`/users/${targetId}/`));
    set((s) => ({
      users: s.users.map((u) => (u.id === targetId ? target : u)),
      artists: s.artists.map((a) => (a.id === targetId && isArtist(target) ? target : a)),
    }));
  },

  verifyArtist: async (artistId, decision, reason = '') => {
    const data = await request<ApiUser>(`/users/${artistId}/verify/`, {
      method: 'POST',
      body: { decision, reason },
    });
    const updated = toUser(data);
    set((s) => ({
      artists: s.artists.map((a) => (a.id === artistId && isArtist(updated) ? updated : a)),
    }));
  },

  addSong: async (input) => {
    const data = await request<ApiSong>('/songs/', {
      method: 'POST',
      body: formData({
        title: input.title,
        genre: input.genre,
        release_year: input.releaseYear,
        lyrics: input.lyrics,
        collaborators: input.collaborators,
        album: input.albumId ?? undefined,
        cover: input.cover,
        audio_file: input.audio,
      }),
    });
    const song = toSong(data);
    set((s) => ({ songs: [song, ...s.songs] }));
    return song;
  },

  updateSong: async (id, patch) => {
    const data = await request<ApiSong>(`/songs/${id}/`, {
      method: 'PATCH',
      body: formData({
        title: patch.title,
        genre: patch.genre,
        release_year: patch.releaseYear,
        lyrics: patch.lyrics,
        cover: patch.cover,
      }),
    });
    const song = toSong(data);
    set((s) => ({ songs: s.songs.map((item) => (item.id === id ? song : item)) }));
  },

  deleteSong: async (id) => {
    await request(`/songs/${id}/`, { method: 'DELETE' });
    set((s) => ({ songs: s.songs.filter((song) => song.id !== id) }));
  },

  addAlbum: async (input) => {
    const data = await request<ApiAlbum>('/albums/', {
      method: 'POST',
      body: formData({
        title: input.title,
        genre: input.genre,
        release_year: input.releaseYear,
        release_type: 'album',
        cover: input.cover,
      }),
    });
    const album = toAlbum(data);
    set((s) => ({ albums: [album, ...s.albums] }));
    return album;
  },

  updateAlbum: async (id, patch) => {
    const data = await request<ApiAlbum>(`/albums/${id}/`, {
      method: 'PATCH',
      body: formData({
        title: patch.title,
        genre: patch.genre,
        release_year: patch.releaseYear,
        cover: patch.cover,
      }),
    });
    const album = toAlbum(data);
    set((s) => ({ albums: s.albums.map((item) => (item.id === id ? album : item)) }));
  },

  deleteAlbum: async (id) => {
    await request(`/albums/${id}/`, { method: 'DELETE' });
    set((s) => ({
      albums: s.albums.filter((album) => album.id !== id),
      songs: s.songs.map((song) =>
        song.albumId === id ? { ...song, albumId: null, albumTitle: undefined } : song,
      ),
    }));
  },

  addSongToAlbum: async (songId, albumId) => {
    const data = await request<ApiSong>(`/songs/${songId}/`, {
      method: 'PATCH',
      body: { album: Number(albumId) },
    });
    const song = toSong(data);
    set((s) => ({
      songs: s.songs.map((item) => (item.id === songId ? song : item)),
      albums: s.albums.map((album) =>
        album.id === albumId ? { ...album, songIds: [...album.songIds, songId] } : album,
      ),
    }));
  },

  removeSongFromAlbum: async (songId) => {
    const previousAlbumId = get().getSongById(songId)?.albumId;
    const data = await request<ApiSong>(`/songs/${songId}/`, {
      method: 'PATCH',
      body: { album: null },
    });
    const song = toSong(data);
    set((s) => ({
      songs: s.songs.map((item) => (item.id === songId ? song : item)),
      albums: s.albums.map((album) =>
        album.id === previousAlbumId
          ? { ...album, songIds: album.songIds.filter((id) => id !== songId) }
          : album,
      ),
    }));
  },
}));
