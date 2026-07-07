import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Music2,
} from 'lucide-react';
import { SongCard } from '@/components/common/SongCard';
import { Button, EmptyState } from '@/components/ui';
import { useCatalogStore } from '@/stores/catalogStore';
import { formatCount, formatDuration } from '@/lib/format';
import type { Song } from '@/types/models';

/** A minimal, neutral page used by routes that don't yet have content to show. */
function PlaceholderPage({ titleKey, descKey }: { titleKey: string; descKey?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-text">{t(titleKey)}</h1>
      <EmptyState icon={Music2} title={t(descKey ?? 'common.noContent')} />
    </div>
  );
}

type RepeatMode = 'off' | 'all' | 'one';

function shuffleSongs(list: Song[]): Song[] {
  return [...list].sort(() => Math.random() - 0.5);
}

export function PlayerPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const songId = searchParams.get('song');
  const getSongById = useCatalogStore((s) => s.getSongById);
  const getSongsByArtist = useCatalogStore((s) => s.getSongsByArtist);
  const popularSongs = useCatalogStore((s) => s.popularSongs);

  const song = songId ? getSongById(songId) : undefined;
  const [isPlaying, setIsPlaying] = useState(true);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [progress, setProgress] = useState(34);

  const queue = useMemo(() => {
    if (!song) return [];
    const related = getSongsByArtist(song.artistId).filter((item) => item.id !== song.id);
    const fallback = popularSongs(6).filter(
      (item) => item.id !== song.id && !related.some((relatedSong) => relatedSong.id === item.id),
    );
    const base = [...related, ...fallback].slice(0, 6);
    return shuffleOn ? shuffleSongs(base) : base;
  }, [getSongsByArtist, popularSongs, shuffleOn, song]);

  if (!song) {
    return (
      <EmptyState
        icon={ListMusic}
        title={t('player.nothingPlaying')}
        description={t('albums.subtitle')}
        action={
          <Link to="/albums">
            <Button>
              <ChevronLeft size={16} className="rtl:rotate-180" />
              {t('player.browseLibrary')}
            </Button>
          </Link>
        }
      />
    );
  }

  const albumLink = song.albumId ? `/albums/${song.albumId}` : null;
  const artistLink = `/artist/${song.artistId}`;
  const locale = i18n.language === 'fa' ? 'fa' : 'en';
  const currentQueue =
    queue.length > 0 ? queue : popularSongs(6).filter((item) => item.id !== song.id);

  return (
    <div className="space-y-8">
      <section className="card-surface grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <img
          src={song.coverUrl}
          alt={song.title}
          className="h-full w-full rounded-2xl object-cover shadow-lg"
        />

        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wide text-muted">{t('player.nowPlaying')}</p>
            <h1 className="text-4xl font-extrabold text-text">{song.title}</h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <Link to={artistLink} className="hover:text-accent">
                {song.artistName}
              </Link>
              {albumLink && (
                <>
                  <span aria-hidden="true">•</span>
                  <Link to={albumLink} className="hover:text-accent">
                    {song.albumTitle}
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <span>{formatDuration(song.duration)}</span>
              <span>
                {formatCount(song.listeners, locale)} {t('artist.listeners')}
              </span>
              <span>
                {formatCount(song.streams, locale)} {t('artist.streams')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-accent"
              aria-label={t('player.progress')}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="icon" onClick={() => setShuffleOn((v) => !v)}>
                <Shuffle size={16} className={shuffleOn ? 'text-accent' : ''} />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={() =>
                  setRepeatMode((current) => {
                    if (current === 'off') return 'all';
                    if (current === 'all') return 'one';
                    return 'off';
                  })
                }
              >
                <Repeat size={16} className={repeatMode !== 'off' ? 'text-accent' : ''} />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setProgress((value) => Math.max(0, value - 10))}
              >
                <SkipBack size={16} />
              </Button>

              <Button onClick={() => setIsPlaying((v) => !v)} className="min-w-28">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? t('player.pause') : t('player.play')}
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setProgress((value) => Math.min(100, value + 10))}
              >
                <SkipForward size={16} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span>
                {t('player.repeat')}: {t(`player.repeatModes.${repeatMode}`)}
              </span>
              <span>
                {t('player.shuffle')}: {shuffleOn ? t('common.yes') : t('common.no')}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-text">{t('player.queue')}</h2>
          <Button variant="secondary" size="sm" onClick={() => navigate('/albums')}>
            {t('player.browseLibrary')}
          </Button>
        </div>

        {currentQueue.length > 0 ? (
          <div className="space-y-3">
            {currentQueue.map((queuedSong) => (
              <SongCard key={queuedSong.id} song={queuedSong} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ListMusic}
            title={t('player.noQueue')}
            action={
              <Link to="/albums">
                <Button>{t('player.browseLibrary')}</Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}

export const ArtistStudioPage = () => <PlaceholderPage titleKey="nav.studio" />;
export const DashboardPage = () => <PlaceholderPage titleKey="nav.dashboard" />;
