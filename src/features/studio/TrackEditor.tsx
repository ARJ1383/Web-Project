import { useState } from 'react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';

export function TrackEditor() {
  const me = useCurrentUser();

  const addSong = useCatalogStore((s) => s.addSong);

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [collaborators, setCollaborators] = useState('');

  const [cover, setCover] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);

  function publishSong() {
    if (!me || !title.trim()) return;

    addSong({
      id: `song_${Date.now()}`,

      title,

      artistId: me.id,

      artistName: 'artistName' in me ? me.artistName : me.displayName,

      albumId: null,

      coverUrl: cover ? URL.createObjectURL(cover) : 'https://picsum.photos/400',

      duration: 0,

      genre,

      releaseYear: year ? Number(year) : undefined,

      lyrics,

      listeners: 0,

      streams: 0,

      audioFile: audio ? URL.createObjectURL(audio) : undefined,

      collaborators: collaborators ? collaborators.split(',').map((x) => x.trim()) : [],

      revenue: 0,

      createdAt: new Date().toISOString(),
    });

    setTitle('');
    setGenre('');
    setYear('');
    setLyrics('');
    setCollaborators('');
    setCover(null);
    setAudio(null);
  }

  return (
    <div className="rounded-2xl card-surface flex flex-col gap-4">
      <h2 className="text-xl font-bold">انتشار آهنگ</h2>

      <input
        className="input"
        placeholder="عنوان آهنگ"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="input"
        placeholder="ژانر"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      />

      <input
        className="input"
        placeholder="سال انتشار"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />

      <input
        className="input"
        placeholder="هنرمندان همکار (با , جدا کنید)"
        value={collaborators}
        onChange={(e) => setCollaborators(e.target.value)}
      />

      <textarea
        className="input min-h-40"
        placeholder="متن ترانه"
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
      />

      <label>
        کاور آهنگ
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
        />
      </label>

      <label>
        فایل صوتی
        <input
          type="file"
          accept=".mp3,.wav,.flac,audio/*"
          onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
        />
      </label>

      <button className="btn-primary" onClick={publishSong}>
        انتشار
      </button>
    </div>
  );
}
