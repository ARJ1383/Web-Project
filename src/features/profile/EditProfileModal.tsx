import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { formData, request } from '@/lib/api';
import { toUser, type ApiUser } from '@/lib/mappers';
import { useAuthStore } from '@/stores/authStore';
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
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const canUploadAvatar = getCapabilities(user.subscription.tier).canUploadAvatar;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const data = await request<ApiUser>('/auth/me/', {
        method: 'PATCH',
        body: formData({
          display_name: displayName.trim() || user.displayName,
          bio: bio.trim(),
          ...(canUploadAvatar ? { avatar } : {}),
        }),
      });
      setCurrentUser(toUser(data));
      toast.success(t('profile.saved'));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSaving(false);
    }
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
          <Button onClick={() => void save()} disabled={saving}>
            {t('common.save')}
          </Button>
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
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">{t('profile.avatar')}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
              className="input-base file:me-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-sm file:text-accent"
            />
          </label>
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
