import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Disc3, Library, Clock, Headphones, Radio, Users2, Wallet } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { Button, EmptyState } from '@/components/ui';
import { request } from '@/lib/api';
import { toArtistReport, type ApiArtistReport } from '@/lib/mappers';
import { formatCount } from '@/lib/format';
import { useLanguageStore } from '@/stores/languageStore';
import { TrackEditor } from './TrackEditor';
import { AlbumEditor } from './AlbumEditor';
import { PublishedWorks } from './PublishedWorks';
import type { ArtistReport } from '@/types/models';

type Tab = 'track' | 'album' | 'works';

/** Work-management panel for verified artists (PDF §2.10). */
export function ArtistStudioPage() {
  const { t } = useTranslation();
  const me = useCurrentUser();
  const language = useLanguageStore((s) => s.language);
  const [tab, setTab] = useState<Tab>('track');
  const [report, setReport] = useState<ArtistReport | null>(null);

  // Every number here is aggregated by the backend (PDF §3.7).
  useEffect(() => {
    if (me?.role !== 'artist') return;
    request<ApiArtistReport>('/reports/artist/')
      .then((data) => setReport(toArtistReport(data)))
      .catch(() => setReport(null));
  }, [me?.role]);

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

      {report && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: <Radio size={18} />, label: t('artist.streams'), value: report.totalStreams },
            {
              icon: <Users2 size={18} />,
              label: t('studio.uniqueListeners'),
              value: report.uniqueListeners,
            },
            {
              icon: <Headphones size={18} />,
              label: t('studio.monthlyStreams'),
              value: report.monthlyStreams,
            },
            { icon: <Wallet size={18} />, label: t('studio.revenue'), value: report.totalRevenue },
          ].map((item) => (
            <div key={item.label} className="card-surface flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm text-muted">
                <span className="text-accent">{item.icon}</span>
                {item.label}
              </span>
              <span className="text-2xl font-extrabold text-text">
                {formatCount(item.value, language)}
              </span>
            </div>
          ))}
        </div>
      )}

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
