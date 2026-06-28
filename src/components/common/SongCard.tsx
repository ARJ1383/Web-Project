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

/** Compact, clickable song row. Clicking the artwork/title opens the player. */
export function SongCard({ song, actions, className }: SongCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2',
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
          className="h-12 w-12 rounded-lg object-cover"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Play size={18} className="text-white" fill="currentColor" />
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => navigate(`/player?song=${song.id}`)}
          className="block max-w-full truncate text-start text-sm font-medium text-text hover:underline"
        >
          {song.title}
        </button>
        <Link
          to={`/artist/${song.artistId}`}
          className="block max-w-full truncate text-start text-xs text-muted hover:text-accent"
        >
          {song.artistName}
        </Link>
      </div>
      <span className="text-xs tabular-nums text-muted">{formatDuration(song.duration)}</span>
      {actions}
    </div>
  );
}
