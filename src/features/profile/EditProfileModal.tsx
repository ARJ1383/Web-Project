import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { useCatalogStore } from '@/stores/catalogStore';
import { getCapabilities } from '@/lib/subscription';
import { toast } from '@/stores/toastStore';
import type { User } from '@/types/models';

export function EditProfileModal({
  user,
  open,
  onClose,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const updateUser = useCatalogStore((s) => s.updateUser);
  const canUploadAvatar = getCapabilities(user.subscription.tier).canUploadAvatar;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');

  const save = () => {
    updateUser(user.id, {
      displayName: displayName.trim() || user.displayName,
      bio: bio.trim() || undefined,
      ...(canUploadAvatar ? { avatarUrl: avatarUrl.trim() || null } : {}),
    });
    toast.success(t('profile.saved'));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('profile.editProfile')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('auth.displayName')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Input label={t('profile.bio')} value={bio} onChange={(e) => setBio(e.target.value)} />

        {canUploadAvatar ? (
          <Input
            label={t('profile.avatarUrl')}
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://"
          />
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm text-muted">
            <Lock size={16} className="shrink-0" />
            {t('profile.avatarLocked')}
          </div>
        )}
      </div>
    </Modal>
  );
}
