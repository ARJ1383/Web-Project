import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, UserPlus, UserMinus } from 'lucide-react';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { EditProfileModal } from './EditProfileModal';
import { Avatar, Button, EmptyState } from '@/components/ui';
import { SubscriptionBadge } from '@/components/common/SubscriptionBadge';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface-2 px-4 py-2">
      <span className="text-lg font-bold text-text">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export function UserProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const me = useCurrentUser();
  const getUserById = useCatalogStore((s) => s.getUserById);
  const toggleFollow = useCatalogStore((s) => s.toggleFollow);
  const [editOpen, setEditOpen] = useState(false);

  const target = id ? getUserById(id) : me;
  if (!me) return null;
  if (!target) return <EmptyState title={t('errors.notFound')} />;

  const isOwn = target.id === me.id;
  const isFollowing = me.followingIds.includes(target.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="card-surface flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <Avatar src={target.avatarUrl} alt={target.displayName} size={112} />
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-text">{target.displayName}</h1>
            <SubscriptionBadge tier={target.subscription.tier} />
          </div>
          <p className="text-sm text-muted">{target.username}</p>
          {target.bio && <p className="text-sm text-muted">{target.bio}</p>}
        </div>

        {isOwn ? (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            {t('profile.editProfile')}
          </Button>
        ) : (
          <Button
            variant={isFollowing ? 'secondary' : 'primary'}
            onClick={() => toggleFollow(me.id, target.id)}
          >
            {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
            {isFollowing ? t('profile.unfollow') : t('profile.follow')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('profile.followers')} value={target.followerIds.length} />
        <Stat label={t('profile.following')} value={target.followingIds.length} />
        <Stat label={t('profile.dailyStreams')} value={target.dailyStreamCount} />
      </div>

      {isOwn && (
        <EditProfileModal user={target} open={editOpen} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}
