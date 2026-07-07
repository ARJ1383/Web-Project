import { AlbumCard } from '@/components/common/AlbumCard';
import { useCatalogStore } from '@/stores/catalogStore';

export function AlbumsPage() {
  const albums = useCatalogStore((state) => state.albums);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-text">Albums</h1>
        <p className="mt-1 text-sm text-muted">Browse all available albums and singles.</p>
      </header>

      {albums.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          No albums found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
