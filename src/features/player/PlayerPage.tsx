import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';

export function PlayerPage() {
  const [params] = useSearchParams();

  const songs = useCatalogStore((s) => s.songs);

  const currentSongId = usePlayerStore((s) => s.currentSongId);
  const playSong = usePlayerStore((s) => s.playSong);

  const songId = params.get('song');

  useEffect(() => {
    if (!songId) return;

    const exists = songs.some((s) => s.id === songId);
    if (!exists) return;

    playSong(
      songId,
      songs.map((s) => s.id),
    );
  }, [songId, songs, playSong]);

  const song = songs.find((s) => s.id === currentSongId);

  if (!song) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold">هیچ آهنگی انتخاب نشده است.</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 p-8">
      <img src={song.coverUrl} alt={song.title} className="h-72 w-72 rounded-2xl object-cover" />

      <h1 className="text-3xl font-bold">{song.title}</h1>

      <p className="text-muted">{song.artistName}</p>
    </div>
  );
}
