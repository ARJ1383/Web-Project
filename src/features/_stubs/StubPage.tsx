import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui';

/**
 * Placeholder for sections owned by other team members (PDF §2.8–§2.11).
 *
 * These routes exist so links from the implemented sections (Home, Artist,
 * Playlists, Settings) resolve cleanly. Teammates replace each stub with the
 * real screen, reusing the shared types, stores and cards already in place.
 */
export function StubPage({ section, owner }: { section: string; owner: string }) {
  const { t } = useTranslation();
  return (
    <div className="py-10">
      <EmptyState
        icon={Construction}
        title={t('stub.title', { section })}
        description={`${t('stub.body')} — ${t('stub.owner')}: ${owner}`}
      />
    </div>
  );
}

// Section → owner map (kept here so the split is documented in one place).
export const AlbumsPage = () => (
  <StubPage section="§2.8 Albums & Singles" owner="امیرمسعود ابراهیمی" />
);
export const AlbumDetailPage = () => (
  <StubPage section="§2.8 Album detail" owner="امیرمسعود ابراهیمی" />
);
export const PlayerPage = () => <StubPage section="§2.9 Music Player" owner="امیرمسعود ابراهیمی" />;
export const ArtistStudioPage = () => (
  <StubPage section="§2.10 Works Management" owner="امیرحسین یگانه‌دوست" />
);
export const DashboardPage = () => (
  <StubPage section="§2.11 Support / Admin Dashboard" owner="امیرحسین یگانه‌دوست" />
);
