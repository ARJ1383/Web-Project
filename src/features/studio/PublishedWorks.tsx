import { useState } from 'react';
import { Pencil, Trash2, Headphones, Radio, DollarSign } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { getCapabilities } from '@/lib/subscription';
import type { Song } from '@/types/models';

export function PublishedWorks() {
  const me = useCurrentUser();

  const songs = useCatalogStore((s) => s.songs.filter((song) => song.artistId === me?.id));

  const updateSong = useCatalogStore((s) => s.updateSong);
  const deleteSong = useCatalogStore((s) => s.deleteSong);

  const [editing, setEditing] = useState<Song | null>(null);
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');

  if (!me || me.role !== 'artist') return null;

  const canSeeStats = getCapabilities(me.subscription.tier).canSeeStats;

  const startEdit = (song: Song) => {
    setEditing(song);
    setTitle(song.title);
    setLyrics(song.lyrics ?? '');
  };

  const saveEdit = () => {
    if (!editing) return;

    updateSong(editing.id, {
      title: title.trim(),
      lyrics: lyrics.trim(),
    });

    setEditing(null);
  };

  return (
    <div className="space-y-3">
      {songs.map((song) => (
        <div
          key={song.id}
          className="card-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <img
              src={song.coverUrl}
              alt={song.title}
              className="h-16 w-16 rounded-xl object-cover"
            />

            <div>
              <h3 className="font-semibold text-text">{song.title}</h3>

              <p className="text-sm text-muted">{song.genre ?? 'Unknown genre'}</p>
            </div>
          </div>

          {canSeeStats ? (
            <div className="flex flex-wrap items-center gap-4 text-sm text-text">
              <div className="flex items-center gap-1">
                <Headphones size={16} />
                {song.listeners}
              </div>

              <div className="flex items-center gap-1">
                <Radio size={16} />
                {song.streams}
              </div>

              <div className="flex items-center gap-1 text-green-600">
                <DollarSign size={16} />
                {(song.revenue ?? 0).toFixed(2)}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">آمار فقط برای کاربران طلایی قابل رویت است.</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => startEdit(song)}
              className="rounded-lg bg-surface-2 p-2 hover:bg-surface-3"
            >
              <Pencil size={18} />
            </button>

            <button
              onClick={() => deleteSong(song.id)}
              className="rounded-lg bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="card-surface mt-6 flex flex-col gap-3 border border-border">
          <h3 className="text-lg font-bold text-text">ویرایش آهنگ</h3>

          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="نام آهنگ"
          />

          <textarea
            className="input min-h-32"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="متن آهنگ"
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-secondary">
              لغو
            </button>

            <button onClick={saveEdit} className="btn-primary">
              ذخیره
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
