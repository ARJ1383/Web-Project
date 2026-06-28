import { Link } from 'react-router-dom';
import { ListMusic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Playlist } from '@/types/models';

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/playlists/${playlist.id}`}
      className="group flex w-40 shrink-0 flex-col gap-2 rounded-2xl p-3 transition-colors hover:bg-surface-2"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent/30 to-surface-2">
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ListMusic size={36} className="text-accent" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">{playlist.name}</p>
        <p className="truncate text-xs text-muted">
          {t('playlists.songCount', { count: playlist.songIds.length })}
        </p>
      </div>
    </Link>
  );
}
