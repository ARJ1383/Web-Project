import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import type { SubscriptionTier } from '@/types/models';
import { Badge } from '@/components/ui';

const tone: Record<SubscriptionTier, 'gold' | 'silver' | 'default'> = {
  gold: 'gold',
  silver: 'silver',
  basic: 'default',
};

export function SubscriptionBadge({ tier }: { tier: SubscriptionTier }) {
  const { t } = useTranslation();
  return (
    <Badge tone={tone[tier]}>
      {tier === 'gold' && <Crown size={12} />}
      {t(`subscription.${tier}`)}
    </Badge>
  );
}
