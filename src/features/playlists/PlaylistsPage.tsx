import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ListMusic } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import { getCapabilities, formatLimit } from '@/lib/subscription';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { PlaylistCard } from '@/components/common/PlaylistCard';
import { Button, EmptyState } from '@/components/ui';
import { toast } from '@/stores/toastStore';

export function PlaylistsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  // Subscribe to the array itself so create/delete re-render this page.
  const allPlaylists = usePlaylistStore((s) => s.playlists);
  const create = usePlaylistStore((s) => s.create);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const playlists = allPlaylists.filter((p) => p.ownerId === user.id);
  const max = getCapabilities(user.subscription.tier).maxPlaylists;
  const atLimit = playlists.length >= max;

  const handleCreate = async (name: string, cover?: File | null) => {
    const created = await create(name, cover);
    if (!created) toast.error(t('playlists.limitReached', { max: formatLimit(max) }));
  };

  const tryOpen = () => {
    if (atLimit) {
      toast.error(t('playlists.limitReached', { max: formatLimit(max) }));
      return;
    }
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">{t('playlists.title')}</h1>
          <p className="text-sm text-muted">
            {playlists.length} {t('playlists.of')} {formatLimit(max)}
          </p>
        </div>
        <Button onClick={tryOpen} disabled={atLimit}>
          <Plus size={16} />
          {t('playlists.create')}
        </Button>
      </div>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListMusic}
          title={t('playlists.empty')}
          action={
            <Button onClick={tryOpen}>
              <Plus size={16} />
              {t('playlists.createFirst')}
            </Button>
          }
        />
      )}

      <CreatePlaylistModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(name, cover) => void handleCreate(name, cover)}
      />
    </div>
  );
}
