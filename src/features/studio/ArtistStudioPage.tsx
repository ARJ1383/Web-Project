import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Disc3, Library, Clock } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { Button, EmptyState } from '@/components/ui';
import { TrackEditor } from './TrackEditor';
import { AlbumEditor } from './AlbumEditor';
import { PublishedWorks } from './PublishedWorks';

type Tab = 'track' | 'album' | 'works';

/** Work-management panel for verified artists (PDF §2.10). */
export function ArtistStudioPage() {
  const { t } = useTranslation();
  const me = useCurrentUser();
  const [tab, setTab] = useState<Tab>('track');

  if (!me || me.role !== 'artist') return null;

  // The studio is reserved for approved artists; pending/rejected accounts
  // see their verification status instead.
  if ('status' in me && me.status !== 'approved') {
    return (
      <EmptyState
        icon={Clock}
        title={t(me.status === 'pending' ? 'studio.pendingTitle' : 'studio.rejectedTitle')}
        description={
          me.status === 'pending' ? t('studio.pendingBody') : (me.statusReason ?? undefined)
        }
      />
    );
  }

  const tabs = [
    { id: 'track' as const, title: t('studio.publishTrack'), icon: <Music size={16} /> },
    { id: 'album' as const, title: t('studio.createAlbum'), icon: <Disc3 size={16} /> },
    { id: 'works' as const, title: t('studio.publishedWorks'), icon: <Library size={16} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-text">{t('studio.title')}</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            {item.title}
          </Button>
        ))}
      </div>

      {tab === 'track' && <TrackEditor />}
      {tab === 'album' && <AlbumEditor />}
      {tab === 'works' && <PublishedWorks />}
    </div>
  );
}
