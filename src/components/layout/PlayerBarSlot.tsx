import { Music2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Fixed player bar at the bottom of every authenticated screen (idle state). */
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
        <span className="text-sm font-medium text-text">{t('player.title')}</span>
        <span className="text-xs text-muted">{t('player.nothingPlaying')}</span>
      </div>
    </div>
  );
}
