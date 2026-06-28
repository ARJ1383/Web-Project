import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Palette, Volume2, BellRing, CreditCard, Trash2, ChevronLeft } from 'lucide-react';
import { useCurrentUser, useAuthStore } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Button, Select, Modal } from '@/components/ui';
import { SubscriptionBadge } from '@/components/common/SubscriptionBadge';
import { toast } from '@/stores/toastStore';
import type { ReactNode } from 'react';

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card-surface flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-text">{label}</span>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const updateUser = useCatalogStore((s) => s.updateUser);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  const updateSettings = (patch: Partial<typeof user.settings>) =>
    updateUser(user.id, { settings: { ...user.settings, ...patch } });

  const onDelete = () => {
    deleteAccount();
    toast.success(t('settings.deleted'));
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-text">{t('settings.title')}</h1>

      <Section icon={<Palette size={18} />} title={t('settings.appearance')}>
        <Row label={t('settings.theme')}>
          <Select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            className="w-40"
            options={[
              { value: 'dark', label: t('settings.themeDark') },
              { value: 'light', label: t('settings.themeLight') },
            ]}
          />
        </Row>
        <Row label={t('settings.language')}>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'fa' | 'en')}
            className="w-40"
            options={[
              { value: 'fa', label: 'فارسی' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Row>
      </Section>

      <Section icon={<Volume2 size={18} />} title={t('settings.audio')}>
        <Row label={`${t('settings.volume')} — ${user.settings.volume}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={user.settings.volume}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            className="w-48 accent-accent"
            aria-label={t('settings.volume')}
          />
        </Row>
      </Section>

      <Section icon={<BellRing size={18} />} title={t('settings.notifications')}>
        <Row label={t('settings.notificationLimit')}>
          <Select
            value={String(user.settings.notificationLimit)}
            onChange={(e) => updateSettings({ notificationLimit: Number(e.target.value) })}
            className="w-28"
            options={[
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
              { value: '200', label: '200' },
            ]}
          />
        </Row>
      </Section>

      <Section icon={<CreditCard size={18} />} title={t('settings.subscriptionSection')}>
        <Row label={t('settings.currentPlan')}>
          <SubscriptionBadge tier={user.subscription.tier} />
        </Row>
        <div className="flex flex-col gap-1">
          <Button variant="secondary" onClick={() => navigate('/player')} className="self-start">
            {t('settings.upgrade')}
            <ChevronLeft size={16} className="rtl:rotate-180" />
          </Button>
          <span className="text-xs text-muted">{t('settings.upgradeHint')}</span>
        </div>
      </Section>

      <Section icon={<Trash2 size={18} />} title={t('settings.dangerZone')}>
        <Button variant="danger" onClick={() => setConfirmOpen(true)} className="self-start">
          <Trash2 size={16} />
          {t('settings.deleteAccount')}
        </Button>
      </Section>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('settings.deleteConfirmTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{t('settings.deleteConfirmBody')}</p>
      </Modal>
    </div>
  );
}
