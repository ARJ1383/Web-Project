import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';

/**
 * Bundled demo track used when a song has no audio source (e.g. a studio
 * upload whose blob URL died after a page reload).
 */
const FALLBACK_SRC = '/audio/sample.mp3';

/**
 * Headless bridge between the player store and the real `<audio>` element.
 * All UI components only touch the store; this is the single place that
 * talks to the browser media API.
 */
export function AudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSongId = usePlayerStore((s) => s.currentSongId);
  const playing = usePlayerStore((s) => s.playing);
  const volume = usePlayerStore((s) => s.volume);
  const pendingSeek = usePlayerStore((s) => s.pendingSeek);
  const consumeSeek = usePlayerStore((s) => s.consumeSeek);
  const syncTime = usePlayerStore((s) => s.syncTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const next = usePlayerStore((s) => s.next);

  const song = useCatalogStore((s) =>
    currentSongId ? s.songs.find((item) => item.id === currentSongId) : undefined,
  );
  const audioSrc = song ? (song.audioFile ?? FALLBACK_SRC) : null;

  // Load a new source only when the track (not unrelated state) changes.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioSrc) return;
    el.src = audioSrc;
    el.load();
    if (usePlayerStore.getState().playing) {
      void el.play().catch(() => {
        /* autoplay may be blocked until the user interacts */
      });
    }
  }, [audioSrc]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !el.src) return;
    if (playing) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Apply user seeks (progress-bar drags) to the element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !pendingSeek) return;
    if (Number.isFinite(el.duration)) {
      el.currentTime = Math.min(pendingSeek.time, el.duration);
    } else {
      el.currentTime = pendingSeek.time;
    }
    consumeSeek();
  }, [pendingSeek, consumeSeek]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      onTimeUpdate={(e) => syncTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      onEnded={next}
      onError={(e) => {
        // Dead source (e.g. expired blob URL) → retry once with the demo track.
        const el = e.currentTarget;
        if (audioSrc && audioSrc !== FALLBACK_SRC) {
          el.src = FALLBACK_SRC;
          el.load();
          if (usePlayerStore.getState().playing) void el.play().catch(() => {});
        }
      }}
    />
  );
}
