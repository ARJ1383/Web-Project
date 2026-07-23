import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Headphones, Radio, Wallet, Library } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Button, EmptyState, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toastStore';
import { formatCount } from '@/lib/format';
import type { Album, Song } from '@/types/models';

/**
 * Manage everything the artist has published: per-work stats (listeners,
 * streams, revenue), edit and delete — for both singles and albums.
 */
export function PublishedWorks() {
  const { t } = useTranslation();
  const me = useCurrentUser();
  const language = useLanguageStore((s) => s.language);

  const songs = useCatalogStore((s) => s.songs.filter((song) => song.artistId === me?.id));
  const albums = useCatalogStore((s) => s.albums.filter((album) => album.artistId === me?.id));

  const updateSong = useCatalogStore((s) => s.updateSong);
  const deleteSong = useCatalogStore((s) => s.deleteSong);
  const updateAlbum = useCatalogStore((s) => s.updateAlbum);
  const deleteAlbum = useCatalogStore((s) => s.deleteAlbum);

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [lyrics, setLyrics] = useState('');

  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');

  const [deleting, setDeleting] = useState<{
    kind: 'song' | 'album';
    id: string;
    name: string;
  } | null>(null);

  if (!me || me.role !== 'artist') return null;

  const startEditSong = (song: Song) => {
    setEditingSong(song);
    setTitle(song.title);
    setGenre(song.genre ?? '');
    setLyrics(song.lyrics ?? '');
  };

  const saveSong = () => {
    if (!editingSong) return;
    updateSong(editingSong.id, {
      title: title.trim() || editingSong.title,
      genre: genre.trim() || undefined,
      lyrics: lyrics.trim() || undefined,
    });
    toast.success(t('studio.saved'));
    setEditingSong(null);
  };

  const saveAlbum = () => {
    if (!editingAlbum) return;
    updateAlbum(editingAlbum.id, { title: albumTitle.trim() || editingAlbum.title });
    toast.success(t('studio.saved'));
    setEditingAlbum(null);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    if (deleting.kind === 'song') deleteSong(deleting.id);
    else deleteAlbum(deleting.id);
    toast.success(t('studio.deleted'));
    setDeleting(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-text">{t('studio.tracksSection')}</h2>

        {songs.length === 0 ? (
          <EmptyState icon={Library} title={t('studio.noWorks')} />
        ) : (
          songs.map((song) => (
            <div
              key={song.id}
              className="card-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-text">{song.title}</h3>
                  <p className="text-sm text-muted">{song.genre ?? t('studio.noGenre')}</p>
                </div>
              </div>

              {/* Artists always see their own per-work stats (PDF §2.10). */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text">
                <span className="flex items-center gap-1" title={t('artist.listeners')}>
                  <Headphones size={16} className="text-muted" />
                  {formatCount(song.listeners, language)}
                </span>
                <span className="flex items-center gap-1" title={t('artist.streams')}>
                  <Radio size={16} className="text-muted" />
                  {formatCount(song.streams, language)}
                </span>
                <span className="flex items-center gap-1 text-success" title={t('studio.revenue')}>
                  <Wallet size={16} />
                  {formatCount(song.revenue ?? 0, language)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditSong(song)}
                  aria-label={t('common.edit')}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting({ kind: 'song', id: song.id, name: song.title })}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} className="text-danger" />
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-text">{t('studio.albumsSection')}</h2>

        {albums.length === 0 ? (
          <p className="text-sm text-muted">{t('studio.noAlbums')}</p>
        ) : (
          albums.map((album) => (
            <div
              key={album.id}
              className="card-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-text">{album.title}</h3>
                  <p className="text-sm text-muted">
                    {t('playlists.songCount', { count: album.songIds.length })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingAlbum(album);
                    setAlbumTitle(album.title);
                  }}
                  aria-label={t('common.edit')}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting({ kind: 'album', id: album.id, name: album.title })}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} className="text-danger" />
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <Modal
        open={!!editingSong}
        onClose={() => setEditingSong(null)}
        title={t('studio.editTrack')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingSong(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveSong}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label={t('studio.trackTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label={t('studio.genre')}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">{t('studio.lyrics')}</span>
            <textarea
              className="input-base min-h-28 resize-y"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={!!editingAlbum}
        onClose={() => setEditingAlbum(null)}
        title={t('studio.editAlbum')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingAlbum(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveAlbum}>{t('common.save')}</Button>
          </>
        }
      >
        <Input
          label={t('studio.albumTitle')}
          value={albumTitle}
          onChange={(e) => setAlbumTitle(e.target.value)}
        />
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('studio.deleteConfirm')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{deleting?.name}</p>
      </Modal>
    </div>
  );
}
