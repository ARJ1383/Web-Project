import { downloadFile } from '@/lib/api';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronUp, Download, ListMusic, Music2, Pause, Play } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCurrentUser } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { getCapabilities } from '@/lib/subscription';
import { formatCount } from '@/lib/format';
import { FullPlayer } from '@/features/player/FullPlayer';
import { QueuePanel } from '@/features/player/QueuePanel';
import { PlayerControls, PlayerProgress, VolumeSlider } from '@/features/player/PlayerControls';

/**
 * Persistent player: full control bar on desktop, compact mini player on
 * mobile. Both expand into the full-screen `FullPlayer`.
 */
export function PlayerBarSlot() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const language = useLanguageStore((s) => s.language);

  const currentSongId = usePlayerStore((s) => s.currentSongId);
  const playing = usePlayerStore((s) => s.playing);
  const toggle = usePlayerStore((s) => s.toggle);

  const song = useCatalogStore((s) =>
    currentSongId ? s.songs.find((item) => item.id === currentSongId) : undefined,
  );

  const [queueOpen, setQueueOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  if (!song) {
    return (
      <div
        data-testid="player-slot"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center gap-3 border-t border-border bg-surface px-4"
      >
        <Music2 size={20} className="text-muted" />
        <span className="text-sm text-muted">{t('player.nothingPlaying')}</span>
      </div>
    );
  }

  const caps = user ? getCapabilities(user.subscription.tier) : undefined;

  const expandCover = (
    <button
      type="button"
      onClick={() => setFullOpen(true)}
      aria-label={t('player.expand')}
      title={t('player.expand')}
      className="group relative shrink-0"
    >
      <img src={song.coverUrl} alt={song.title} className="h-12 w-12 rounded-lg object-cover" />
      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <ChevronUp size={18} className="text-white" />
      </span>
    </button>
  );

  return (
    <div
      data-testid="player-slot"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface"
    >
      {/* ---- Mobile mini player ---- */}
      <div className="flex flex-col md:hidden">
        <PlayerProgress fallbackDuration={song.duration} showTimes={false} />
        <div className="flex items-center gap-2 px-3 pb-2 pt-1">
          {expandCover}
          <button
            type="button"
            onClick={() => setFullOpen(true)}
            aria-label={t('player.expand')}
            className="min-w-0 flex-1 text-start"
          >
            <span className="block truncate text-sm font-semibold text-text">{song.title}</span>
            <span className="block truncate text-xs text-muted">
              {song.artistName}
              {song.albumTitle ? ` • ${song.albumTitle}` : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? t('player.pause') : t('player.play')}
            className="rounded-full bg-accent p-2.5 text-white"
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            type="button"
            onClick={() => setFullOpen(true)}
            aria-label={t('player.expand')}
            className="rounded-lg p-2 text-muted hover:text-text"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>

      {/* ---- Desktop bar ---- */}
      <div className="hidden flex-col gap-1 px-4 py-2 md:flex">
        <PlayerProgress fallbackDuration={song.duration} />

        <div className="flex items-center gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {expandCover}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{song.title}</p>
              <div className="flex gap-1 text-xs text-muted">
                <Link to={`/artist/${song.artistId}`} className="truncate hover:text-accent">
                  {song.artistName}
                </Link>
                {song.albumId && song.albumTitle && (
                  <>
                    <span aria-hidden>•</span>
                    <Link to={`/albums/${song.albumId}`} className="truncate hover:text-accent">
                      {song.albumTitle}
                    </Link>
                  </>
                )}
              </div>
              {caps?.canSeeStats && (
                <p className="text-xs text-muted">
                  {t('player.listeners')}: {formatCount(song.listeners, language)}
                  {' · '}
                  {t('player.streams')}: {formatCount(song.streams, language)}
                </p>
              )}
            </div>
          </div>

          <PlayerControls />

          <div className="flex flex-1 items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setQueueOpen((v) => !v)}
              aria-label={t('player.queue')}
              title={t('player.queue')}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <ListMusic size={18} />
            </button>

            {caps?.canDownload && (
              <button
                type="button"
                onClick={() => {
                  void downloadFile(`/songs/${song.id}/download/`, `${song.title}.mp3`);
                }}
                aria-label={t('player.download')}
                title={t('player.download')}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <Download size={18} />
              </button>
            )}

            <VolumeSlider className="ms-2 hidden lg:flex" />
          </div>
        </div>
      </div>

      {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}
      {fullOpen && <FullPlayer onClose={() => setFullOpen(false)} />}
    </div>
  );
}
