import { useEffect, useState } from 'react';
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
import { request } from '@/lib/api';
import { toSong, type ApiSong } from '@/lib/mappers';
import type { Song } from '@/types/models';

export function HomePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  // Subscribe to the arrays themselves so catalog/playlist changes re-render.
  const allAlbums = useCatalogStore((s) => s.albums);
  const allSongs = useCatalogStore((s) => s.songs);
  const allPlaylists = usePlaylistStore((s) => s.playlists);
  const [recommendations, setRecommendations] = useState<Song[]>([]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    request<Array<{ song: ApiSong; score: number; reason: string }>>('/songs/recommendations/')
      .then((items) => {
        if (!cancelled) setRecommendations(items.map((item) => toSong(item.song)));
      })
      .catch(() => {
        if (!cancelled) setRecommendations([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  const playlists = allPlaylists.filter((p) => p.ownerId === user.id);
  const albums = [...allAlbums]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 10);
  const songs = [...allSongs].sort((a, b) => b.streams - a.streams).slice(0, 8);
  const earlyAccessSongs = allSongs.filter((song) => song.isReleased === false);
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

      {caps.earlyAccess && earlyAccessSongs.length > 0 && (
        <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4 shadow-glow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            <h2 className="text-lg font-bold text-text">{t('home.earlyAccess')}</h2>
          </div>
          <div className="space-y-2">
            {earlyAccessSongs.slice(0, 8).map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <h2 className="text-xl font-bold text-text">{t('home.recommendedSongs')}</h2>
        </div>
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {recommendations.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <EmptyState title={t('home.emptyShowcase')} />
        )}
      </section>

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
