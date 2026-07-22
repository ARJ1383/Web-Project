import { create } from 'zustand';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  queue: string[];
  currentSongId: string | null;

  playing: boolean;

  currentTime: number;
  duration: number;

  volume: number;

  shuffle: boolean;
  repeat: RepeatMode;

  playSong: (songId: string, queue?: string[]) => void;

  play: () => void;
  pause: () => void;
  toggle: () => void;

  next: () => void;
  previous: () => void;

  seek: (time: number) => void;

  setDuration: (time: number) => void;

  setVolume: (value: number) => void;

  toggleShuffle: () => void;

  cycleRepeat: () => void;

  addToQueue: (songId: string) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentSongId: null,

  playing: false,

  currentTime: 0,
  duration: 0,

  volume: 70,

  shuffle: false,

  repeat: 'off',

  playSong: (songId, queue) =>
    set({
      currentSongId: songId,
      queue: queue ?? [songId],
      playing: true,
      currentTime: 0,
    }),

  play: () => set({ playing: true }),

  pause: () => set({ playing: false }),

  toggle: () => set((s) => ({ playing: !s.playing })),

  seek: (time) => set({ currentTime: time }),

  setDuration: (time) => set({ duration: time }),

  setVolume: (value) => set({ volume: value }),

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  cycleRepeat: () => {
    const mode = get().repeat;

    if (mode === 'off') return set({ repeat: 'all' });

    if (mode === 'all') return set({ repeat: 'one' });

    set({ repeat: 'off' });
  },

  next: () => {
    const { queue, currentSongId, repeat, shuffle } = get();

    if (!queue.length || !currentSongId) return;

    if (repeat === 'one') {
      set({ currentTime: 0 });
      return;
    }

    if (shuffle) {
      const next = queue[Math.floor(Math.random() * queue.length)];

      set({
        currentSongId: next,
        currentTime: 0,
      });

      return;
    }

    const index = queue.indexOf(currentSongId);

    if (index === queue.length - 1) {
      if (repeat === 'all') {
        set({
          currentSongId: queue[0],
          currentTime: 0,
        });
      }

      return;
    }

    set({
      currentSongId: queue[index + 1],
      currentTime: 0,
    });
  },

  previous: () => {
    const { queue, currentSongId } = get();

    if (!queue.length || !currentSongId) return;

    const index = queue.indexOf(currentSongId);

    if (index <= 0) return;

    set({
      currentSongId: queue[index - 1],
      currentTime: 0,
    });
  },

  addToQueue: (songId) =>
    set((s) => ({
      queue: [...s.queue, songId],
    })),

  removeFromQueue: (songId) =>
    set((s) => ({
      queue: s.queue.filter((id) => id !== songId),
    })),

  clearQueue: () =>
    set({
      queue: [],
    }),
}));
