import { Navigate, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlbumCard } from '@/components/common/AlbumCard';
import { SongCard } from '@/components/common/SongCard';
import { SongPlaylistMenu } from '@/components/common/SongPlaylistMenu';
import { Button, EmptyState } from '@/components/ui';
import { useCatalogStore } from '@/stores/catalogStore';
import { formatCount } from '@/lib/format';

export function AlbumDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const getAlbumById = useCatalogStore((state) => state.getAlbumById);
  const getSongById = useCatalogStore((state) => state.getSongById);
  const getAlbumsByArtist = useCatalogStore((state) => state.getAlbumsByArtist);

  const album = getAlbumById(id ?? '');

  if (!album) {
    return <Navigate to="/albums" replace />;
  }

  const songs = album.songIds
    .map((songId) => getSongById(songId))
    .filter((song): song is NonNullable<typeof song> => song !== undefined);

  const otherAlbums = getAlbumsByArtist(album.artistId).filter((a) => a.id !== album.id);

  const totalListeners = songs.reduce((sum, song) => sum + song.listeners, 0);
  const totalStreams = songs.reduce((sum, song) => sum + song.streams, 0);
  const locale = i18n.language === 'fa' ? 'fa' : 'en';

  return (
    <div className="space-y-10">
      <section className="card-surface flex flex-col gap-6 md:flex-row">
        <img
          src={album.coverUrl}
          alt={album.title}
          className="h-64 w-64 rounded-2xl object-cover shadow-lg"
        />

        <div className="flex flex-1 flex-col justify-end">
          <p className="text-sm uppercase tracking-wide text-muted">
            {album.releaseType === 'album' ? t('albums.typeAlbum') : t('albums.typeSingle')}
          </p>

          <h1 className="mt-2 text-5xl font-bold text-text">{album.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link to={`/artist/${album.artistId}`}>
              <Button variant="secondary" size="sm">
                {album.artistName}
              </Button>
            </Link>

            {album.releaseYear && (
              <span className="text-sm text-muted">
                {t('albums.releaseYear', { year: album.releaseYear })}
              </span>
            )}

            {album.genre && <span className="text-sm text-muted">{album.genre}</span>}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            <span>
              {songs.length} {t('albums.songs')}
            </span>
            <span>
              {formatCount(totalListeners, locale)} {t('artist.listeners')}
            </span>
            <span>
              {formatCount(totalStreams, locale)} {t('artist.streams')}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-text">{t('albums.songs')}</h2>

        {songs.length > 0 ? (
          <div className="space-y-3">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} actions={<SongPlaylistMenu songId={song.id} />} />
            ))}
          </div>
        ) : (
          <EmptyState title={t('albums.noSongs')} description={t('albums.subtitle')} />
        )}
      </section>

      {otherAlbums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-text">
            {t('albums.moreFromArtist', { name: album.artistName })}
          </h2>

          <div className="flex gap-5 overflow-x-auto pb-2">
            {otherAlbums.map((otherAlbum) => (
              <AlbumCard key={otherAlbum.id} album={otherAlbum} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
