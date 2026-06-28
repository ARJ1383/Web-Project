import { Music2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Placeholder for the music player (PDF §2.9), which a teammate implements.
 *
 * It reserves a fixed bar at the bottom of every authenticated screen so the
 * real player can be mounted here without changing the surrounding layout.
 * Content areas add bottom padding to clear this bar.
 */
export function PlayerBarSlot() {
  const { t } = useTranslation();
  return (
    <div
      data-testid="player-slot"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center gap-3 border-t border-border bg-surface px-4"
    >
      <span className="rounded-lg bg-surface-2 p-2 text-muted">
        <Music2 size={18} />
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-text">{t('app.name')} Player</span>
        <span className="text-xs text-muted">{t('common.comingSoon')} · §2.9</span>
      </div>
    </div>
  );
}
