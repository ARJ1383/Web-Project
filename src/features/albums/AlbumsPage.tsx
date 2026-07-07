import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListMusic } from 'lucide-react';
import { AlbumCard } from '@/components/common/AlbumCard';
import { SongCard } from '@/components/common/SongCard';
import { SongPlaylistMenu } from '@/components/common/SongPlaylistMenu';
import { Button, EmptyState, Input, Select } from '@/components/ui';
import { useCatalogStore } from '@/stores/catalogStore';
import type { Album, Song } from '@/types/models';

type ViewMode = 'all' | 'albums' | 'singles';
type SortMode = 'latest' | 'listeners' | 'title';

function albumScore(album: Album, songsById: Map<string, Song>): number {
  return album.songIds.reduce((sum, songId) => sum + (songsById.get(songId)?.listeners ?? 0), 0);
}

function songScore(song: Song): number {
  return song.listeners;
}

export function AlbumsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('all');
  const [sort, setSort] = useState<SortMode>('latest');

  const albums = useCatalogStore((state) => state.albums);
  const songs = useCatalogStore((state) => state.songs);

  const songsById = useMemo(() => new Map(songs.map((song) => [song.id, song] as const)), [songs]);
  const normalizedQuery = query.trim().toLowerCase();

  const compareByTitle = (a: { title: string }, b: { title: string }) =>
    a.title.localeCompare(b.title, 'fa', { sensitivity: 'base' });

  const compareLatest = (a: { createdAt: string }, b: { createdAt: string }) =>
    +new Date(b.createdAt) - +new Date(a.createdAt);

  const filteredAlbums = useMemo(() => {
    const list = albums.filter((album) => {
      if (!normalizedQuery) return true;
      return (
        album.title.toLowerCase().includes(normalizedQuery) ||
        album.artistName.toLowerCase().includes(normalizedQuery)
      );
    });

    return [...list].sort((a, b) => {
      if (sort === 'title') return compareByTitle(a, b);
      if (sort === 'listeners') return albumScore(b, songsById) - albumScore(a, songsById);
      return compareLatest(a, b);
    });
  }, [albums, normalizedQuery, songsById, sort]);

  const singles = useMemo(() => {
    const list = songs.filter(
      (song) =>
        song.albumId === null &&
        (!normalizedQuery ||
          song.title.toLowerCase().includes(normalizedQuery) ||
          song.artistName.toLowerCase().includes(normalizedQuery) ||
          (song.albumTitle?.toLowerCase().includes(normalizedQuery) ?? false)),
    );

    return [...list].sort((a, b) => {
      if (sort === 'title') return compareByTitle(a, b);
      if (sort === 'listeners') return songScore(b) - songScore(a);
      return compareLatest(a, b);
    });
  }, [songs, normalizedQuery, sort]);

  const showAlbums = view !== 'singles';
  const showSingles = view !== 'albums';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted">{t('nav.albums')}</p>
        <h1 className="text-3xl font-bold text-text">{t('albums.title')}</h1>
        <p className="max-w-2xl text-sm text-muted">{t('albums.subtitle')}</p>
      </header>

      <section className="card-surface space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('albums.searchPlaceholder')}
            aria-label={t('albums.searchPlaceholder')}
          />

          <Select
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            options={[
              { value: 'all', label: t('albums.viewAll') },
              { value: 'albums', label: t('albums.albumsOnly') },
              { value: 'singles', label: t('albums.singlesOnly') },
            ]}
          />

          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            options={[
              { value: 'latest', label: t('albums.sortLatest') },
              { value: 'listeners', label: t('albums.sortListeners') },
              { value: 'title', label: t('albums.sortTitle') },
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('all')}
          >
            {t('albums.viewAll')}
          </Button>
          <Button
            variant={view === 'albums' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('albums')}
          >
            {t('albums.albumsOnly')}
          </Button>
          <Button
            variant={view === 'singles' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('singles')}
          >
            {t('albums.singlesOnly')}
          </Button>
        </div>
      </section>

      {showAlbums && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-text">{t('albums.albumsSection')}</h2>
            <span className="text-sm text-muted">{filteredAlbums.length}</span>
          </div>

          {filteredAlbums.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title={normalizedQuery ? t('albums.noResults') : t('albums.noAlbums')}
              description={t('albums.subtitle')}
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>
      )}

      {showSingles && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-text">{t('albums.singlesSection')}</h2>
            <span className="text-sm text-muted">{singles.length}</span>
          </div>

          {singles.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title={normalizedQuery ? t('albums.noResults') : t('albums.noSingles')}
              description={t('albums.subtitle')}
            />
          ) : (
            <div className="space-y-3">
              {singles.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  actions={<SongPlaylistMenu songId={song.id} />}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
