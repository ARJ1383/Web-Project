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
  onCreate: (name: string) => void;
}) {
  const { t } = useTranslation();

  const [name, setName] = useState('');

  const user = useCurrentUser();

  const playlists = usePlaylistStore((state) => (user ? state.getByOwner(user.id) : []));

  const canCreate = !!user && canCreatePlaylist(user.subscription.tier, playlists.length);

  const submit = () => {
    if (!name.trim() || !canCreate) return;

    onCreate(name.trim());
    setName('');
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
      <Input
        label={t('playlists.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={t('playlists.namePlaceholder')}
        autoFocus
      />
    </Modal>
  );
}
