import { useTranslation } from 'react-i18next';
import { Play, Trash2, X } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { startPlayback } from '@/lib/playback';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Floating "up next" panel: view, reorder-by-click and prune the queue. */
export function QueuePanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const queue = usePlayerStore((s) => s.queue);
  const currentSongId = usePlayerStore((s) => s.currentSongId);
  const remove = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const songs = useCatalogStore((s) => s.songs);

  return (
    <div className="fixed bottom-24 end-4 z-[60] flex max-h-96 w-80 flex-col rounded-2xl border border-border bg-surface p-4 shadow-glow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-text">{t('player.queue')}</h3>

        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={clearQueue}
              aria-label={t('player.clearQueue')}
              title={t('player.clearQueue')}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto">
        {queue.length === 0 && <p className="text-sm text-muted">{t('player.queueEmpty')}</p>}

        {queue.map((id) => {
          const song = songs.find((s) => s.id === id);

          if (!song) return null;

          const isCurrent = id === currentSongId;

          return (
            <div
              key={id}
              className={cn(
                'flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-surface-2',
                isCurrent && 'bg-accent/10',
              )}
            >
              <button
                type="button"
                onClick={() => void startPlayback(id, queue)}
                className="flex min-w-0 flex-1 items-center gap-2 text-start"
              >
                {isCurrent && (
                  <Play size={14} className="shrink-0 text-accent" fill="currentColor" />
                )}
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block truncate text-sm',
                      isCurrent ? 'font-semibold text-accent' : 'text-text',
                    )}
                  >
                    {song.title}
                  </span>
                  <span className="block truncate text-xs text-muted">{song.artistName}</span>
                </span>
              </button>

              <span className="shrink-0 text-xs tabular-nums text-muted">
                {formatDuration(song.duration)}
              </span>

              <button
                type="button"
                onClick={() => remove(id)}
                aria-label={t('common.delete')}
                title={t('common.delete')}
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-danger"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
