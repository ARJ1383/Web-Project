import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import type { Artist } from '@/types/models';
import { Avatar } from '@/components/ui';

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className="group flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl p-3 text-center transition-colors hover:bg-surface-2"
    >
      <Avatar src={artist.avatarUrl} alt={artist.artistName} size={96} />
      <div className="flex items-center gap-1">
        <span className="truncate text-sm font-medium text-text">{artist.artistName}</span>
        {artist.verified && <BadgeCheck size={14} className="shrink-0 text-accent" />}
      </div>
    </Link>
  );
}
