import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@/components/ui';
import { useCurrentUser } from '@/stores/authStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import { canCreatePlaylist } from '@/lib/subscription';

export function CreatePlaylistModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, cover?: File | null) => void;
}) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [cover, setCover] = useState<File | null>(null);

  const user = useCurrentUser();

  const playlists = usePlaylistStore((state) => (user ? state.getByOwner(user.id) : []));

  const canCreate = !!user && canCreatePlaylist(user.subscription.tier, playlists.length);

  const submit = () => {
    if (!name.trim() || !canCreate) return;

    onCreate(name.trim(), cover);
    setName('');
    setCover(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('playlists.create')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>

          <Button onClick={submit} disabled={!name.trim() || !canCreate}>
            {t('common.create')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label={t('playlists.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('playlists.namePlaceholder')}
          autoFocus
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">{t('playlists.cover')}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            className="input-base file:me-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-sm file:text-accent"
          />
        </label>
      </div>
    </Modal>
  );
}
