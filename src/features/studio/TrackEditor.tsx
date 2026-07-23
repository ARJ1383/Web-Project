import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { Button, Input } from '@/components/ui';
import { toast } from '@/stores/toastStore';
import { readAudioDuration, readFileAsDataUrl } from '@/lib/files';
import { uid } from '@/lib/format';

/** Publish a single track: audio upload (MP3/WAV/FLAC), cover, metadata, lyrics. */
export function TrackEditor() {
  const { t } = useTranslation();
  const me = useCurrentUser();

  const addSong = useCatalogStore((s) => s.addSong);

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [collaborators, setCollaborators] = useState('');

  const [cover, setCover] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);

  if (!me || me.role !== 'artist') return null;

  const publishSong = async () => {
    if (!title.trim()) {
      toast.error(t('studio.titleRequired'));
      return;
    }
    if (!audio) {
      toast.error(t('studio.audioRequired'));
      return;
    }

    setPublishing(true);
    try {
      const audioUrl = URL.createObjectURL(audio);
      const [coverUrl, duration] = await Promise.all([
        cover
          ? readFileAsDataUrl(cover)
          : Promise.resolve(`https://picsum.photos/seed/${uid('cv')}/400/400`),
        readAudioDuration(audioUrl),
      ]);

      addSong({
        id: uid('song'),
        title: title.trim(),
        artistId: me.id,
        artistName: 'artistName' in me ? me.artistName : me.displayName,
        albumId: null,
        coverUrl,
        duration,
        genre: genre.trim() || undefined,
        releaseYear: year ? Number(year) : undefined,
        lyrics: lyrics.trim() || undefined,
        listeners: 0,
        streams: 0,
        audioFile: audioUrl,
        collaborators: collaborators
          ? collaborators
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
        revenue: 0,
        createdAt: new Date().toISOString(),
      });

      toast.success(t('studio.trackPublished'));
      setTitle('');
      setGenre('');
      setYear('');
      setLyrics('');
      setCollaborators('');
      setCover(null);
      setAudio(null);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="card-surface flex flex-col gap-4">
      <h2 className="text-xl font-bold text-text">{t('studio.publishTrack')}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t('studio.trackTitle')}
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
        <Input
          label={t('studio.collaborators')}
          value={collaborators}
          onChange={(e) => setCollaborators(e.target.value)}
          hint={t('studio.collaboratorsHint')}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">{t('studio.lyrics')}</span>
        <textarea
          className="input-base min-h-32 resize-y"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">{t('studio.cover')}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            className="input-base file:me-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-sm file:text-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">{t('studio.audioFile')}</span>
          <input
            type="file"
            accept=".mp3,.wav,.flac,audio/*"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            className="input-base file:me-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-sm file:text-accent"
          />
          <span className="text-xs text-muted">{t('studio.audioFormats')}</span>
        </label>
      </div>

      <Button onClick={() => void publishSong()} disabled={publishing} className="self-start">
        <UploadCloud size={16} />
        {t('studio.publish')}
      </Button>
    </div>
  );
}
