import { Navigate, useParams } from 'react-router-dom';
import { AlbumCard } from '@/components/common/AlbumCard';
import { SongCard } from '@/components/common/SongCard';
import { useCatalogStore } from '@/stores/catalogStore';

export function AlbumDetailPage() {
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

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="flex flex-col gap-6 md:flex-row">
        <img
          src={album.coverUrl}
          alt={album.title}
          className="h-64 w-64 rounded-2xl object-cover shadow-lg"
        />

        <div className="flex flex-col justify-end">
          <p className="text-sm uppercase tracking-wide text-muted">{album.releaseType}</p>

          <h1 className="mt-2 text-5xl font-bold text-text">{album.title}</h1>

          <p className="mt-3 text-lg text-muted">{album.artistName}</p>

          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
            {album.releaseYear && <span>{album.releaseYear}</span>}

            {album.genre && <span>{album.genre}</span>}

            <span>
              {songs.length} song{songs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      {/* Songs */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-text">Songs</h2>

        <div className="space-y-2">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      {/* More albums */}
      {otherAlbums.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-text">More from {album.artistName}</h2>

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
