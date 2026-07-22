import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCurrentUser } from '@/stores/authStore';

import { ListMusic } from 'lucide-react';
import { QueuePanel } from '@/features/player/QueuePanel';
import { useState } from 'react';

import { FullPlayer } from '@/features/player/FullPlayer';

export function PlayerBarSlot() {
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

  const [queueOpen, setQueueOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  if (!song) {
    return (
      <div
        data-testid="player-slot"
        onClick={() => setFullOpen(true)}
        className="
          fixed
          inset-x-0
          bottom-0
          z-40
          flex
          h-16
          items-center
          gap-3
          border-t
          border-border
          bg-surface
          px-4
        "
      >
        <Music2 size={20} className="text-muted" />
        <span className="text-sm text-muted">چیزی در حال پخش نیست</span>
      </div>
    );
  }

  const isGold = user?.subscription.tier === 'gold';

  return (
    <div
      data-testid="player-slot"
      className="
        fixed
        inset-x-0
        bottom-0
        z-40
        flex
        flex-col
        border-t
        border-border
        bg-surface
        px-4
        py-2
      "
    >
      {/* progress */}
      <input
        type="range"
        min={0}
        max={duration || song.duration}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
        className="w-full"
      />

      <div className="flex items-center gap-4">
        {/* cover */}
        <img src={song.coverUrl} alt={song.title} className="h-12 w-12 rounded-lg object-cover" />

        {/* info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">{song.title}</p>

          <div className="flex gap-1 text-xs text-muted">
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

          {isGold && (
            <p className="text-xs text-muted">
              شنونده: {song.listeners}
              {' | '}
              پخش: {song.streams}
            </p>
          )}
        </div>

        {/* controls */}

        <button
          onClick={toggle}
          className="
            rounded-full
            bg-accent
            p-2
            text-white
          "
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button onClick={next}>
          <SkipForward size={20} />
        </button>

        <button onClick={previous}>
          <SkipBack size={20} />
        </button>

        <button onClick={() => setQueueOpen(true)}>
          <ListMusic size={20} />
        </button>

        {/* shuffle */}

        <button onClick={toggleShuffle} className={shuffle ? 'text-accent' : 'text-muted'}>
          <Shuffle size={20} />
        </button>

        {/* repeat */}

        <button
          onClick={cycleRepeat}
          className={repeat !== 'off' ? 'text-accent' : 'text-muted'}
          title={`Repeat: ${repeat}`}
        >
          <Repeat size={20} />
        </button>

        {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}

        {/* volume */}

        <Volume2 size={18} />

        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24"
        />
      </div>

      {fullOpen && <FullPlayer onClose={() => setFullOpen(false)} />}
    </div>
  );
}
