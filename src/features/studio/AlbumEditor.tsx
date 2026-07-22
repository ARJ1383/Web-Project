import { useState } from 'react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';

export function AlbumEditor() {
  const me = useCurrentUser();

  const addAlbum = useCatalogStore((s) => s.addAlbum);
  const addSongToAlbum = useCatalogStore((s) => s.addSongToAlbum);

  const songs = useCatalogStore((s) =>
    s.songs.filter((song) => song.artistId === me?.id && song.albumId === null),
  );

  const [title, setTitle] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  function toggleSong(id: string) {
    setSelectedSongs((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function createAlbum() {
    if (!me || !title.trim()) return;

    const albumId = `album_${Date.now()}`;

    addAlbum({
      id: albumId,
      title,
      artistId: me.id,
      artistName: 'artistName' in me ? me.artistName : me.displayName,
      coverUrl: 'https://picsum.photos/400',
      releaseType: 'album',
      songIds: [],
      createdAt: new Date().toISOString(),
    });

    selectedSongs.forEach((songId) => addSongToAlbum(songId, albumId));

    setTitle('');
    setSelectedSongs([]);
  }

  return (
    <div className="card-surface flex flex-col gap-4">
      <h2 className="text-xl font-bold">ساخت آلبوم</h2>

      <input
        className="input"
        placeholder="عنوان آلبوم"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div>
        <p className="mb-2 font-medium">انتخاب آهنگ‌ها</p>

        <div className="flex flex-col gap-2">
          {songs.map((song) => (
            <label key={song.id} className="flex gap-2">
              <input
                type="checkbox"
                checked={selectedSongs.includes(song.id)}
                onChange={() => toggleSong(song.id)}
              />

              {song.title}
            </label>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={createAlbum}>
        ایجاد آلبوم
      </button>
    </div>
  );
}
