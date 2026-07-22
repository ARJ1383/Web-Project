import { useState } from 'react';
import { Music, Disc3, Library } from 'lucide-react';

import { TrackEditor } from './TrackEditor';
import { AlbumEditor } from './AlbumEditor';
import { PublishedWorks } from './PublishedWorks';

type Tab = 'track' | 'album' | 'works';

export function ArtistStudioPage() {
  const [tab, setTab] = useState<Tab>('track');

  const tabs = [
    {
      id: 'track' as const,
      title: 'انتشار آهنگ',
      icon: <Music size={18} />,
    },
    {
      id: 'album' as const,
      title: 'ساخت آلبوم',
      icon: <Disc3 size={18} />,
    },
    {
      id: 'works' as const,
      title: 'آثار منتشر شده',
      icon: <Library size={18} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">استودیوی هنرمند</h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${
              tab === t.id ? 'bg-primary text-white' : 'bg-surface-2'
            }`}
          >
            {t.icon}
            {t.title}
          </button>
        ))}
      </div>

      {tab === 'track' && <TrackEditor />}
      {tab === 'album' && <AlbumEditor />}
      {tab === 'works' && <PublishedWorks />}
    </div>
  );
}
