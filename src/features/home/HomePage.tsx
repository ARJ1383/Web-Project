import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import { getCapabilities } from '@/lib/subscription';
import { Showcase } from '@/components/common/Showcase';
import { PlaylistCard } from '@/components/common/PlaylistCard';
import { AlbumCard } from '@/components/common/AlbumCard';
import { SongCard } from '@/components/common/SongCard';
import { EmptyState } from '@/components/ui';

export function HomePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const latestAlbums = useCatalogStore((s) => s.latestAlbums);
  const popularSongs = useCatalogStore((s) => s.popularSongs);
  const getByOwner = usePlaylistStore((s) => s.getByOwner);

  if (!user) return null;

  const playlists = getByOwner(user.id);
  const albums = latestAlbums(10);
  const songs = popularSongs(8);
  const caps = getCapabilities(user.subscription.tier);

  return (
    <div className="flex flex-col gap-8">
      {playlists.length > 0 && (
        <Showcase title={t('home.recentPlaylists')}>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Showcase>
      )}

      <Showcase title={t('home.latestAlbums')}>
        {albums.length > 0 ? (
          albums.map((a) => <AlbumCard key={a.id} album={a} />)
        ) : (
          <p className="text-sm text-muted">{t('home.emptyShowcase')}</p>
        )}
      </Showcase>

      {caps.earlyAccess && (
        <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4 shadow-glow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            <h2 className="text-lg font-bold text-text">{t('home.earlyAccess')}</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {albums.slice(0, 4).map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-text">{t('home.popularSongs')}</h2>
        {songs.length > 0 ? (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {songs.map((s) => (
              <SongCard key={s.id} song={s} />
            ))}
          </div>
        ) : (
          <EmptyState title={t('home.emptyShowcase')} />
        )}
      </section>
    </div>
  );
}
