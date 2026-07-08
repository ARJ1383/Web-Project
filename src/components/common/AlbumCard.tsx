import { Link } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import type { Album } from '@/types/models';

export function AlbumCard({ album }: { album: Album }) {
  return (
    <div
      className="
        group
        flex
        w-40
        shrink-0
        flex-col
        gap-2
        rounded-2xl
        p-3
        transition-colors
        hover:bg-surface-2
      "
    >
      {/* Album navigation */}
      <Link to={`/albums/${album.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              group-hover:scale-105
            "
            loading="lazy"
          />

          <span
            className="
              absolute
              bottom-2
              end-2
              rounded-full
              bg-black/55
              p-1
              text-white
            "
          >
            <Disc3 size={14} />
          </span>
        </div>
      </Link>

      <div className="min-w-0">
        {/* Album title */}
        <Link
          to={`/albums/${album.id}`}
          className="
            block
            truncate
            text-sm
            font-medium
            text-text
            hover:underline
          "
        >
          {album.title}
        </Link>

        {/* Artist navigation */}
        <Link
          to={`/artist/${album.artistId}`}
          className="
            block
            truncate
            text-xs
            text-muted
            hover:text-accent
          "
        >
          {album.artistName}
        </Link>
      </div>
    </div>
  );
}
