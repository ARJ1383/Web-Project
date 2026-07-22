import { X, Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCurrentUser } from '@/stores/authStore';

export function FullPlayer({ onClose }: { onClose: () => void }) {
  const user = useCurrentUser();

  const songs = useCatalogStore((s) => s.songs);

  const {
    currentSongId,
    playing,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
  } = usePlayerStore();

  const song = songs.find((s) => s.id === currentSongId);

  if (!song) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        flex-col
        items-center
        gap-6
        overflow-y-auto
        bg-surface
        p-6
      "
    >
      <button className="self-end" onClick={onClose}>
        <X />
      </button>

      <img
        src={song.coverUrl}
        alt={song.title}
        className="
          h-72
          w-72
          rounded-2xl
          object-cover
        "
      />

      <div className="text-center">
        <h1 className="text-3xl font-bold">{song.title}</h1>

        <div className="mt-2 flex justify-center gap-2 text-muted">
          <Link to={`/artist/${song.artistId}`} className="hover:text-accent">
            {song.artistName}
          </Link>

          {song.albumId && (
            <>
              <span>•</span>

              <Link to={`/albums/${song.albumId}`} className="hover:text-accent">
                {song.albumTitle}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* progress */}

      <input
        type="range"
        min={0}
        max={duration || song.duration}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
        className="w-full max-w-xl"
      />

      {/* controls */}

      <div className="flex items-center gap-5">
        <button onClick={toggleShuffle} className={shuffle ? 'text-accent' : 'text-muted'}>
          <Shuffle />
        </button>

        <button onClick={previous}>
          <SkipBack />
        </button>

        <button
          onClick={toggle}
          className="
            rounded-full
            bg-accent
            p-4
            text-white
          "
        >
          {playing ? <Pause /> : <Play />}
        </button>

        <button onClick={next}>
          <SkipForward />
        </button>

        <button onClick={cycleRepeat} className={repeat !== 'off' ? 'text-accent' : 'text-muted'}>
          <Repeat />
        </button>
      </div>

      {/* volume */}

      <div className="flex items-center gap-3">
        <Volume2 />

        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>

      {/* Gold stats */}

      {user?.subscription.tier === 'gold' && (
        <p className="text-sm text-muted">
          شنونده: {song.listeners}
          {' | '}
          پخش: {song.streams}
        </p>
      )}

      {/* lyrics */}

      {song.lyrics && (
        <div
          className="
            max-w-xl
            whitespace-pre-line
            text-center
            text-sm
            text-muted
          "
        >
          {song.lyrics}
        </div>
      )}
    </div>
  );
}
