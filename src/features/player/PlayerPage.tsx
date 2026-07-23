import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music2 } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCurrentUser } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { getCapabilities } from '@/lib/subscription';
import { startPlayback } from '@/lib/playback';
import { formatCount } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { PlayerControls, PlayerProgress } from './PlayerControls';

/**
 * Deep-linkable now-playing page (`/player?song=…`). Playback controls also
 * live in the persistent bottom bar; this page adds the large artwork,
 * gold-tier stats and lyrics.
 */
export function PlayerPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const user = useCurrentUser();
  const language = useLanguageStore((s) => s.language);

  const currentSongId = usePlayerStore((s) => s.currentSongId);
  const song = useCatalogStore((s) =>
    currentSongId ? s.songs.find((item) => item.id === currentSongId) : undefined,
  );

  const songId = params.get('song');

  // Deep link: start the requested song once (with the full catalog as queue).
  useEffect(() => {
    if (!songId) return;
    const { songs } = useCatalogStore.getState();
    if (songId === usePlayerStore.getState().currentSongId) return;
    if (!songs.some((s) => s.id === songId)) return;
    startPlayback(
      songId,
      songs.map((s) => s.id),
    );
  }, [songId]);

  if (!song) {
    return <EmptyState icon={Music2} title={t('player.nothingPlaying')} />;
  }

  const caps = user ? getCapabilities(user.subscription.tier) : undefined;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-4">
      <img
        src={song.coverUrl}
        alt={song.title}
        className="h-64 w-64 rounded-2xl object-cover shadow-glow-sm sm:h-72 sm:w-72"
      />

      <div className="text-center">
        <h1 className="text-3xl font-bold text-text">{song.title}</h1>

        <div className="mt-2 flex justify-center gap-2 text-muted">
          <Link to={`/artist/${song.artistId}`} className="hover:text-accent">
            {song.artistName}
          </Link>
          {song.albumId && song.albumTitle && (
            <>
              <span aria-hidden>•</span>
              <Link to={`/albums/${song.albumId}`} className="hover:text-accent">
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

      {song.lyrics && (
        <section className="w-full rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-text">{t('player.lyrics')}</h2>
          <p className="whitespace-pre-line text-center text-sm leading-7 text-muted">
            {song.lyrics}
          </p>
        </section>
      )}
    </div>
  );
}
