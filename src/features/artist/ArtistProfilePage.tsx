import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, UserPlus, UserMinus, Headphones, Radio } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { getCapabilities } from '@/lib/subscription';
import { formatCount } from '@/lib/format';
import { useLanguageStore } from '@/stores/languageStore';
import { Avatar, Button, Badge, EmptyState } from '@/components/ui';
import { AlbumCard } from '@/components/common/AlbumCard';
import { SongCard } from '@/components/common/SongCard';

export function ArtistProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const language = useLanguageStore((s) => s.language);
  const me = useCurrentUser();
  const getArtistById = useCatalogStore((s) => s.getArtistById);
  const getAlbumsByArtist = useCatalogStore((s) => s.getAlbumsByArtist);
  const getSongsByArtist = useCatalogStore((s) => s.getSongsByArtist);
  const toggleFollow = useCatalogStore((s) => s.toggleFollow);

  const artist = id ? getArtistById(id) : undefined;
  if (!me) return null;
  if (!artist) return <EmptyState title={t('errors.notFound')} />;

  const albums = getAlbumsByArtist(artist.id);
  const singles = getSongsByArtist(artist.id).filter((s) => !s.albumId);
  const isFollowing = me.followingIds.includes(artist.id);
  const canSeeStats = getCapabilities(me.subscription.tier).canSeeStats;

  return (
    <div className="flex flex-col gap-6">
      <div className="card-surface flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <Avatar src={artist.avatarUrl} alt={artist.artistName} size={120} />
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-text">{artist.artistName}</h1>
            {artist.verified && (
              <Badge tone="accent">
                <BadgeCheck size={14} />
                {t('artist.verified')}
              </Badge>
            )}
          </div>
          {artist.bio && <p className="max-w-prose text-sm text-muted">{artist.bio}</p>}
        </div>

        <Button
          variant={isFollowing ? 'secondary' : 'primary'}
          onClick={() => toggleFollow(me.id, artist.id)}
        >
          {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
          {isFollowing ? t('profile.unfollow') : t('profile.follow')}
        </Button>
      </div>

      {canSeeStats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="card-surface flex items-center gap-3">
            <span className="rounded-xl bg-accent/15 p-2 text-accent">
              <Headphones size={20} />
            </span>
            <div>
              <p className="text-lg font-bold text-text">
                {formatCount(artist.totalListeners, language)}
              </p>
              <p className="text-xs text-muted">{t('artist.listeners')}</p>
            </div>
          </div>
          <div className="card-surface flex items-center gap-3">
            <span className="rounded-xl bg-accent/15 p-2 text-accent">
              <Radio size={20} />
            </span>
            <div>
              <p className="text-lg font-bold text-text">
                {formatCount(artist.totalStreams, language)}
              </p>
              <p className="text-xs text-muted">{t('artist.streams')}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
          {t('artist.statsGoldOnly')}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-text">{t('artist.albums')}</h2>
        {albums.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('home.emptyShowcase')}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-text">{t('artist.singles')}</h2>
        {singles.length > 0 ? (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {singles.map((s) => (
              <SongCard key={s.id} song={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('home.emptyShowcase')}</p>
        )}
      </section>
    </div>
  );
}
