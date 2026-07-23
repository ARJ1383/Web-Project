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

  /**
   * One-shot seek request. The UI only mutates state; `AudioController` applies
   * it to the real `<audio>` element and then clears it. The nonce lets two
   * consecutive seeks to the same time still fire.
   */
  pendingSeek: { time: number; nonce: number } | null;

  playSong: (songId: string, queue?: string[]) => void;

  play: () => void;
  pause: () => void;
  toggle: () => void;

  next: () => void;
  previous: () => void;

  /** User-initiated seek (progress-bar drag). */
  requestSeek: (time: number) => void;
  /** Called by AudioController once the seek reached the audio element. */
  consumeSeek: () => void;
  /** Playback-position sync coming back from the audio element. */
  syncTime: (time: number) => void;

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

  pendingSeek: null,

  playSong: (songId, queue) =>
    set((s) => ({
      currentSongId: songId,
      queue: queue ?? [songId],
      playing: true,
      currentTime: 0,
      duration: songId === s.currentSongId ? s.duration : 0,
      // Restart from the top even when the same song is re-selected.
      pendingSeek: { time: 0, nonce: (s.pendingSeek?.nonce ?? 0) + 1 },
    })),

  play: () => set({ playing: true }),

  pause: () => set({ playing: false }),

  toggle: () => set((s) => ({ playing: !s.playing })),

  requestSeek: (time) =>
    set((s) => ({
      currentTime: time,
      pendingSeek: { time, nonce: (s.pendingSeek?.nonce ?? 0) + 1 },
    })),

  consumeSeek: () => set({ pendingSeek: null }),

  syncTime: (time) => set({ currentTime: time }),

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
      get().requestSeek(0);
      set({ playing: true });
      return;
    }

    if (shuffle) {
      const others = queue.filter((id) => id !== currentSongId);
      const pool = others.length > 0 ? others : queue;
      const nextId = pool[Math.floor(Math.random() * pool.length)];

      set({ currentSongId: nextId, currentTime: 0, duration: 0, playing: true });
      return;
    }

    const index = queue.indexOf(currentSongId);

    if (index === queue.length - 1) {
      if (repeat === 'all') {
        set({ currentSongId: queue[0], currentTime: 0, duration: 0, playing: true });
      } else {
        set({ playing: false });
      }
      return;
    }

    set({ currentSongId: queue[index + 1], currentTime: 0, duration: 0, playing: true });
  },

  previous: () => {
    const { queue, currentSongId, currentTime } = get();

    if (!queue.length || !currentSongId) return;

    const index = queue.indexOf(currentSongId);

    // Standard player behaviour: restart the track unless we are at its very start.
    if (currentTime > 3 || index <= 0) {
      get().requestSeek(0);
      return;
    }

    set({ currentSongId: queue[index - 1], currentTime: 0, duration: 0 });
  },

  addToQueue: (songId) =>
    set((s) => (s.queue.includes(songId) ? s : { queue: [...s.queue, songId] })),

  removeFromQueue: (songId) =>
    set((s) => ({
      queue: s.queue.filter((id) => id !== songId),
    })),

  clearQueue: () =>
    set({
      queue: [],
    }),
}));
