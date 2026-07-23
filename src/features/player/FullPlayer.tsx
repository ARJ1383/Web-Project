import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Download, ListMusic } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCurrentUser } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { getCapabilities } from '@/lib/subscription';
import { formatCount } from '@/lib/format';
import { QueuePanel } from './QueuePanel';
import { PlayerControls, PlayerProgress, VolumeSlider } from './PlayerControls';

/** Full-screen player view (the expanded state of the mini player / bar). */
export function FullPlayer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const language = useLanguageStore((s) => s.language);

  const currentSongId = usePlayerStore((s) => s.currentSongId);
  const song = useCatalogStore((s) =>
    currentSongId ? s.songs.find((item) => item.id === currentSongId) : undefined,
  );

  const [queueOpen, setQueueOpen] = useState(false);

  if (!song) return null;

  const caps = user ? getCapabilities(user.subscription.tier) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center gap-6 overflow-y-auto bg-surface p-6">
      <div className="flex w-full max-w-xl items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('player.collapse')}
          title={t('player.collapse')}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <ChevronDown size={22} />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQueueOpen((v) => !v)}
            aria-label={t('player.queue')}
            title={t('player.queue')}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ListMusic size={20} />
          </button>

          {caps?.canDownload && (
            <a
              href={song.audioFile ?? '/audio/sample.mp3'}
              download={`${song.title}.mp3`}
              aria-label={t('player.download')}
              title={t('player.download')}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <Download size={20} />
            </a>
          )}
        </div>
      </div>

      <img
        src={song.coverUrl}
        alt={song.title}
        className="h-64 w-64 rounded-2xl object-cover shadow-glow-sm sm:h-72 sm:w-72"
      />

      <div className="text-center">
        <h1 className="text-3xl font-bold text-text">{song.title}</h1>

        <div className="mt-2 flex justify-center gap-2 text-muted">
          <Link to={`/artist/${song.artistId}`} onClick={onClose} className="hover:text-accent">
            {song.artistName}
          </Link>

          {song.albumId && song.albumTitle && (
            <>
              <span aria-hidden>•</span>
              <Link to={`/albums/${song.albumId}`} onClick={onClose} className="hover:text-accent">
                {song.albumTitle}
              </Link>
            </>
          )}
        </div>

        {caps?.canSeeStats && (
          <p className="mt-2 text-sm text-muted">
            {t('player.listeners')}: {formatCount(song.listeners, language)}
            {' · '}
            {t('player.streams')}: {formatCount(song.streams, language)}
          </p>
        )}
      </div>

      <PlayerProgress fallbackDuration={song.duration} className="max-w-xl" />

      <PlayerControls size="lg" />

      <VolumeSlider />

      {song.lyrics && (
        <section className="w-full max-w-xl rounded-2xl border border-border bg-surface-2 p-4">
          <h2 className="mb-2 text-sm font-semibold text-text">{t('player.lyrics')}</h2>
          <p className="whitespace-pre-line text-center text-sm leading-7 text-muted">
            {song.lyrics}
          </p>
        </section>
      )}

      {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}
    </div>
  );
}
