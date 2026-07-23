import { Link, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Song } from '@/types/models';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';
import { startPlayback } from '@/lib/playback';
import { useCatalogStore } from '@/stores/catalogStore';

export interface SongCardProps {
  song: Song;
  actions?: ReactNode;
  className?: string;
}

/**
 * Compact song card.
 *
 * - Artwork/title -> player
 * - Artist name -> artist page
 * - Album name -> album page
 */
export function SongCard({ song, actions, className }: SongCardProps) {
  const navigate = useNavigate();

  const songs = useCatalogStore((s) => s.songs);

  const play = () => {
    const started = startPlayback(
      song.id,
      songs.map((s) => s.id),
    );
    if (started) navigate(`/player?song=${song.id}`);
  };

  return (
    <div
      className={cn(
        'card-surface flex items-center gap-3 p-3 transition-colors hover:border-accent/40 hover:bg-surface-2/60',
        className,
      )}
    >
      <button
        type="button"
        onClick={play}
        className="group relative shrink-0"
        aria-label={`play ${song.title}`}
      >
        <img
          src={song.coverUrl}
          alt={song.title}
          className="h-14 w-14 rounded-xl object-cover"
          loading="lazy"
        />

        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Play size={18} className="text-white" fill="currentColor" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={play}
          className="block max-w-full truncate text-start text-sm font-semibold text-text hover:underline"
        >
          {song.title}
        </button>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <Link to={`/artist/${song.artistId}`} className="truncate hover:text-accent">
            {song.artistName}
          </Link>

          {song.albumId && song.albumTitle && (
            <>
              <span aria-hidden="true">•</span>

              <Link to={`/albums/${song.albumId}`} className="truncate hover:text-accent">
                {song.albumTitle}
              </Link>
            </>
          )}
        </div>
      </div>

      <span className="shrink-0 text-xs tabular-nums text-muted">
        {formatDuration(song.duration)}
      </span>

      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
