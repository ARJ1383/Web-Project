import { useTranslation } from 'react-i18next';
import { Music2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';

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

export const AlbumsPage = () => <PlaceholderPage titleKey="nav.albums" />;
export const AlbumDetailPage = () => <PlaceholderPage titleKey="nav.albums" />;
export const PlayerPage = () => (
  <PlaceholderPage titleKey="player.title" descKey="player.nothingPlaying" />
);
export const ArtistStudioPage = () => <PlaceholderPage titleKey="nav.studio" />;
