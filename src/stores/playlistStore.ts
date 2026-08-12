import { create } from 'zustand';
import { ApiError, formData, request, requestAll } from '@/lib/api';
import { toPlaylist, type ApiPlaylist } from '@/lib/mappers';
import type { Playlist } from '@/types/models';

interface PlaylistState {
  playlists: Playlist[];
  getByOwner: (ownerId: string) => Playlist[];
  getById: (id: string) => Playlist | undefined;
  hydrate: () => Promise<void>;
  /** Creates a playlist; returns null when the plan limit rejects it. */
  create: (name: string, cover?: File | null) => Promise<Playlist | null>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addSong: (playlistId: string, songId: string) => Promise<void>;
  removeSong: (playlistId: string, songId: string) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>()((set, get) => ({
  playlists: [],

  getByOwner: (ownerId) => get().playlists.filter((p) => p.ownerId === ownerId),
  getById: (id) => get().playlists.find((p) => p.id === id),

  hydrate: async () => {
    const data = await requestAll<ApiPlaylist>('/playlists/');
    set({ playlists: data.map(toPlaylist) });
  },

  create: async (name, cover) => {
    try {
      const data = await request<ApiPlaylist>('/playlists/', {
        method: 'POST',
        body: formData({ name: name.trim(), cover }),
      });
      const playlist = toPlaylist(data);
      set((s) => ({ playlists: [playlist, ...s.playlists] }));
      return playlist;
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) return null;
      throw error;
    }
  },

  rename: async (id, name) => {
    const data = await request<ApiPlaylist>(`/playlists/${id}/`, {
      method: 'PATCH',
      body: { name: name.trim() },
    });
    const playlist = toPlaylist(data);
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? playlist : p)) }));
  },

  remove: async (id) => {
    await request(`/playlists/${id}/`, { method: 'DELETE' });
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
  },

  addSong: async (playlistId, songId) => {
    const data = await request<ApiPlaylist>(`/playlists/${playlistId}/songs/${songId}/`, {
      method: 'POST',
    });
    const playlist = toPlaylist(data);
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === playlistId ? playlist : p)) }));
  },

  removeSong: async (playlistId, songId) => {
    await request(`/playlists/${playlistId}/songs/${songId}/`, { method: 'DELETE' });
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === playlistId ? { ...p, songIds: p.songIds.filter((id) => id !== songId) } : p,
      ),
    }));
  },
}));
