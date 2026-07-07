import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ListMusic, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Modal } from '@/components/ui';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePlaylistStore } from '@/stores/playlistStore';

interface SongPlaylistMenuProps {
  songId: string;
}

/**
 * Modal-based menu for adding/removing a song from the current user's playlists.
 */
export function SongPlaylistMenu({ songId }: SongPlaylistMenuProps) {
  const { t } = useTranslation();
  const me = useCurrentUser();
  const song = useCatalogStore((s) => s.getSongById(songId));
  const playlists = usePlaylistStore((s) => (me ? s.getByOwner(me.id) : []));
  const addSong = usePlaylistStore((s) => s.addSong);
  const removeSong = usePlaylistStore((s) => s.removeSong);
  const [open, setOpen] = useState(false);

  if (!me) return null;

  const toggle = (playlistId: string, hasSong: boolean) => {
    if (hasSong) removeSong(playlistId, songId);
    else addSong(playlistId, songId);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={t('albums.addToPlaylist')}
        title={t('albums.addToPlaylist')}
      >
        <ListMusic size={16} />
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          song ? t('albums.playlistsForSong', { title: song.title }) : t('albums.playlistsTitle')
        }
        className="max-w-md"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('common.close')}
          </Button>
        }
      >
        {playlists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title={t('albums.noPlaylists')}
            description={t('albums.noPlaylistsDescription')}
            action={
              <Link to="/playlists" onClick={() => setOpen(false)}>
                <Button>
                  <Plus size={16} />
                  {t('playlists.create')}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {playlists.map((playlist) => {
              const hasSong = playlist.songIds.includes(songId);
              return (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => toggle(playlist.id, hasSong)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3 text-start transition hover:border-accent/50 hover:bg-surface-2/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{playlist.name}</p>
                    <p className="text-xs text-muted">
                      {t('playlists.songCount', { count: playlist.songIds.length })}
                    </p>
                  </div>

                  <span className="ml-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-accent">
                    <Check size={14} className={hasSong ? 'opacity-100' : 'opacity-30'} />
                    {hasSong ? t('albums.removeFromPlaylist') : t('albums.addToPlaylist')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
