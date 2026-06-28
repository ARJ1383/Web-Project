import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, ListMusic } from 'lucide-react';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCurrentUser } from '@/stores/authStore';
import { SongCard } from '@/components/common/SongCard';
import { Button, EmptyState, Modal, Input } from '@/components/ui';
import { toast } from '@/stores/toastStore';

export function PlaylistDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useCurrentUser();
  const playlist = usePlaylistStore((s) => (id ? s.getById(id) : undefined));
  const rename = usePlaylistStore((s) => s.rename);
  const remove = usePlaylistStore((s) => s.remove);
  const removeSong = usePlaylistStore((s) => s.removeSong);
  const getSongById = useCatalogStore((s) => s.getSongById);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(playlist?.name ?? '');

  if (!me) return null;
  if (!playlist) return <EmptyState title={t('errors.notFound')} />;

  const songs = playlist.songIds.map(getSongById).filter((s): s is NonNullable<typeof s> => !!s);
  const isOwner = playlist.ownerId === me.id;

  const onRename = () => {
    if (name.trim()) rename(playlist.id, name.trim());
    setRenameOpen(false);
  };

  const onDelete = () => {
    remove(playlist.id);
    toast.success(t('common.delete'));
    navigate('/playlists', { replace: true });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="card-surface flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/30 to-surface-2">
          <ListMusic size={36} className="text-accent" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-text">{playlist.name}</h1>
          <p className="text-sm text-muted">{t('playlists.songCount', { count: songs.length })}</p>
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/albums')}>
              <Plus size={16} />
              {t('playlists.addSongs')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setName(playlist.name);
                setRenameOpen(true);
              }}
              aria-label={t('playlists.rename')}
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} className="text-danger" />
            </Button>
          </div>
        )}
      </div>

      {songs.length > 0 ? (
        <div className="flex flex-col gap-1">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              actions={
                isOwner ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSong(playlist.id, song.id)}
                    aria-label={t('common.delete')}
                  >
                    <X size={16} className="text-muted" />
                  </Button>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListMusic}
          title={t('playlists.emptyDetail')}
          action={
            isOwner ? (
              <Link to="/albums">
                <Button>
                  <Plus size={16} />
                  {t('playlists.addSongs')}
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={t('playlists.rename')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={onRename}>{t('common.save')}</Button>
          </>
        }
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} label={t('playlists.name')} />
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('playlists.deleteConfirm')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{playlist.name}</p>
      </Modal>
    </div>
  );
}
