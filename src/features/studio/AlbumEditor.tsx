import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Disc3 } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { Button, Input } from '@/components/ui';
import { toast } from '@/stores/toastStore';
import { readFileAsDataUrl } from '@/lib/files';
import { uid } from '@/lib/format';

/** Create an album from the artist's existing single tracks (PDF §2.10). */
export function AlbumEditor() {
  const { t } = useTranslation();
  const me = useCurrentUser();

  const addAlbum = useCatalogStore((s) => s.addAlbum);
  const addSongToAlbum = useCatalogStore((s) => s.addSongToAlbum);

  const songs = useCatalogStore((s) =>
    s.songs.filter((song) => song.artistId === me?.id && song.albumId === null),
  );

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  if (!me || me.role !== 'artist') return null;

  const toggleSong = (id: string) =>
    setSelectedSongs((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const createAlbum = async () => {
    if (!title.trim()) {
      toast.error(t('studio.titleRequired'));
      return;
    }

    setCreating(true);
    try {
      const albumId = uid('album');
      const coverUrl = cover
        ? await readFileAsDataUrl(cover)
        : `https://picsum.photos/seed/${albumId}/400/400`;

      addAlbum({
        id: albumId,
        title: title.trim(),
        artistId: me.id,
        artistName: 'artistName' in me ? me.artistName : me.displayName,
        coverUrl,
        releaseType: 'album',
        genre: genre.trim() || undefined,
        releaseYear: year ? Number(year) : undefined,
        songIds: [],
        createdAt: new Date().toISOString(),
      });

      selectedSongs.forEach((songId) => addSongToAlbum(songId, albumId));

      toast.success(t('studio.albumCreated'));
      setTitle('');
      setGenre('');
      setYear('');
      setCover(null);
      setSelectedSongs([]);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="card-surface flex flex-col gap-4">
      <h2 className="text-xl font-bold text-text">{t('studio.createAlbum')}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t('studio.albumTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input label={t('studio.genre')} value={genre} onChange={(e) => setGenre(e.target.value)} />
        <Input
          type="number"
          label={t('studio.releaseYear')}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">{t('studio.cover')}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            className="input-base file:me-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-sm file:text-accent"
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text">{t('studio.pickSongs')}</p>

        {songs.length === 0 ? (
          <p className="text-sm text-muted">{t('studio.noSingles')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {songs.map((song) => (
              <label
                key={song.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-text"
              >
                <input
                  type="checkbox"
                  checked={selectedSongs.includes(song.id)}
                  onChange={() => toggleSong(song.id)}
                  className="h-4 w-4 accent-accent"
                />
                {song.title}
              </label>
            ))}
          </div>
        )}
      </div>

      <Button onClick={() => void createAlbum()} disabled={creating} className="self-start">
        <Disc3 size={16} />
        {t('studio.create')}
      </Button>
    </div>
  );
}
