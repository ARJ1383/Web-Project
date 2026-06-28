import { Link } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import type { Album } from '@/types/models';

/**
 * Album/single artwork card. Links to the album detail page (section 2.8 —
 * owned by a teammate; currently a stub route).
 */
export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link
      to={`/albums/${album.id}`}
      className="group flex w-40 shrink-0 flex-col gap-2 rounded-2xl p-3 transition-colors hover:bg-surface-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <img
          src={album.coverUrl}
          alt={album.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute bottom-2 end-2 rounded-full bg-black/55 p-1 text-white">
          <Disc3 size={14} />
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">{album.title}</p>
        <p className="truncate text-xs text-muted">{album.artistName}</p>
      </div>
    </Link>
  );
}
