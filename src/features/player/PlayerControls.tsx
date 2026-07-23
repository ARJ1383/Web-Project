import { useTranslation } from 'react-i18next';
import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Transport buttons (shuffle / previous / play-pause / next / repeat).
 *
 * Media controls keep an LTR flow even in the RTL UI (time always moves
 * left→right), hence `dir="ltr"` on the cluster.
 */
export function PlayerControls({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { t } = useTranslation();
  const playing = usePlayerStore((s) => s.playing);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const iconSize = size === 'lg' ? 22 : 18;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const repeatLabel =
    repeat === 'off'
      ? t('player.repeatOff')
      : repeat === 'all'
        ? t('player.repeatAll')
        : t('player.repeatOne');

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={toggleShuffle}
        aria-label={t('player.shuffle')}
        aria-pressed={shuffle}
        title={t('player.shuffle')}
        className={cn(
          'rounded-lg p-2 transition-colors hover:bg-surface-2',
          shuffle ? 'text-accent' : 'text-muted',
        )}
      >
        <Shuffle size={iconSize} />
      </button>

      <button
        type="button"
        onClick={previous}
        aria-label={t('player.previous')}
        title={t('player.previous')}
        className="rounded-lg p-2 text-text transition-colors hover:bg-surface-2"
      >
        <SkipBack size={iconSize} />
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t('player.pause') : t('player.play')}
        title={playing ? t('player.pause') : t('player.play')}
        className={cn(
          'rounded-full bg-accent text-white shadow-glow-sm transition-transform hover:scale-105',
          size === 'lg' ? 'p-4' : 'p-2.5',
        )}
      >
        {playing ? <Pause size={iconSize} /> : <Play size={iconSize} />}
      </button>

      <button
        type="button"
        onClick={next}
        aria-label={t('player.next')}
        title={t('player.next')}
        className="rounded-lg p-2 text-text transition-colors hover:bg-surface-2"
      >
        <SkipForward size={iconSize} />
      </button>

      <button
        type="button"
        onClick={cycleRepeat}
        aria-label={repeatLabel}
        title={repeatLabel}
        className={cn(
          'rounded-lg p-2 transition-colors hover:bg-surface-2',
          repeat !== 'off' ? 'text-accent' : 'text-muted',
        )}
      >
        <RepeatIcon size={iconSize} />
      </button>
    </div>
  );
}

/** Seekable progress bar with elapsed / total time labels. */
export function PlayerProgress({
  fallbackDuration,
  showTimes = true,
  className,
}: {
  /** Used until the audio element reports its real duration. */
  fallbackDuration: number;
  showTimes?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const requestSeek = usePlayerStore((s) => s.requestSeek);

  const total = duration || fallbackDuration;

  return (
    <div dir="ltr" className={cn('flex w-full items-center gap-2', className)}>
      {showTimes && (
        <span className="w-10 shrink-0 text-end text-xs tabular-nums text-muted">
          {formatDuration(currentTime)}
        </span>
      )}
      <input
        type="range"
        min={0}
        max={total}
        step={1}
        value={Math.min(currentTime, total)}
        onChange={(e) => requestSeek(Number(e.target.value))}
        aria-label={t('player.progress')}
        className="h-1.5 w-full cursor-pointer accent-accent"
      />
      {showTimes && (
        <span className="w-10 shrink-0 text-xs tabular-nums text-muted">
          {formatDuration(total)}
        </span>
      )}
    </div>
  );
}

/** Volume slider (kept LTR: louder to the right). */
export function VolumeSlider({ className }: { className?: string }) {
  const { t } = useTranslation();
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);

  return (
    <div dir="ltr" className={cn('flex items-center gap-2', className)}>
      <Volume2 size={18} className="shrink-0 text-muted" />
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label={t('player.volume')}
        className="h-1.5 w-24 cursor-pointer accent-accent"
      />
    </div>
  );
}
