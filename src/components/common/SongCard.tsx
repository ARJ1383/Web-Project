import { Link, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Song } from '@/types/models';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface SongCardProps {
  song: Song;
  /** Optional trailing controls (e.g. add-to-playlist menu). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Compact song card used across the app.
 *
 * The artwork/title open the mock player, while the optional actions slot can
 * host playlist menus or remove buttons.
 */
export function SongCard({ song, actions, className }: SongCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'card-surface flex items-center gap-3 p-3 transition-colors hover:border-accent/40 hover:bg-surface-2/60',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => navigate(`/player?song=${song.id}`)}
        className="relative shrink-0"
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
          onClick={() => navigate(`/player?song=${song.id}`)}
          className="block max-w-full truncate text-start text-sm font-semibold text-text hover:underline"
        >
          {song.title}
        </button>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <Link to={`/artist/${song.artistId}`} className="truncate hover:text-accent">
            {song.artistName}
          </Link>

          {song.albumTitle && song.albumId && (
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
