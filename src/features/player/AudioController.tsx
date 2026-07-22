import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';

export function AudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const songs = useCatalogStore((s) => s.songs);

  const { currentSongId, playing, volume, seek, setDuration, next, pause } = usePlayerStore();

  const song = songs.find((s) => s.id === currentSongId);

  useEffect(() => {
    if (!audioRef.current || !song) return;

    audioRef.current.src = song.coverUrl;
    audioRef.current.load();

    if (playing) {
      audioRef.current.play();
    }
  }, [song]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={(e) => seek(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      onEnded={() => {
        next();
      }}
    />
  );
}
