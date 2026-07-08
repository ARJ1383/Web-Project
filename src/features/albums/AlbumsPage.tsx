import { useMemo, useState } from 'react';
import { AlbumCard } from '@/components/common/AlbumCard';
import { SongCard } from '@/components/common/SongCard';
import { useCatalogStore } from '@/stores/catalogStore';
import { AddToPlaylistMenu } from '@/components/common/AddToPlaylistMenu';

type SortMode = 'listeners' | 'date';

export function AlbumsPage() {
  const albums = useCatalogStore((state) => state.albums);
  const songs = useCatalogStore((state) => state.songs);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('listeners');

  const filteredAlbums = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = albums.filter((album) => {
      if (!q) return true;

      return album.title.toLowerCase().includes(q) || album.artistName.toLowerCase().includes(q);
    });

    if (sort === 'date') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return result;
  }, [albums, query, sort]);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = songs.filter((song) => {
      if (!q) return true;

      return (
        song.title.toLowerCase().includes(q) ||
        song.artistName.toLowerCase().includes(q) ||
        song.albumTitle?.toLowerCase().includes(q)
      );
    });

    if (sort === 'listeners') {
      result = [...result].sort((a, b) => b.listeners - a.listeners);
    }

    if (sort === 'date') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return result;
  }, [songs, query, sort]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-text">آلبوم ها و تک‌آهنگ ها</h1>

        <p className="mt-1 text-sm text-muted">موسیقی خود را پیدا کنید...</p>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو بر اساس نام آلبوم، آهنگ، هنرمند و ..."
          className="
            w-full
            rounded-xl
            border
            border-border
            bg-surface
            px-5
            py-4
            text-base
            text-text
            outline-none
            sm:max-w-xl
          "
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="
            rounded-xl
            border
            border-border
            bg-surface
            px-4
            py-2
            text-text
          "
        >
          <option value="listeners">بیشترین شنونده</option>

          <option value="date">جدیدترین انتشار</option>
        </select>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-text">آلبوم ها</h2>

        <div
          className="
          grid
          grid-cols-2
          gap-5
          sm:grid-cols-3
          lg:grid-cols-5
        "
        >
          {filteredAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-text">آهنگ ها</h2>

        <div className="space-y-2">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} actions={<AddToPlaylistMenu songId={song.id} />} />
          ))}
        </div>
      </section>
    </div>
  );
}
