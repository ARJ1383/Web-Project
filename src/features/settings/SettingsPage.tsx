import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Palette, Volume2, BellRing, CreditCard, Trash2, ChevronLeft } from 'lucide-react';
import { useCurrentUser, useAuthStore } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Button, Select, Modal } from '@/components/ui';
import { SubscriptionBadge } from '@/components/common/SubscriptionBadge';
import { SupportSection } from '@/features/support/SupportSection';
import { toast } from '@/stores/toastStore';
import { request } from '@/lib/api';
import { saveSettings } from '@/lib/preferences';
import { formatCount, formatDate } from '@/lib/format';
import type { ReactNode } from 'react';
import type { SubscriptionTier } from '@/types/models';

const MONTH_OPTIONS = [1, 3, 6, 12];

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
  const plans = useCatalogStore((s) => s.plans);
  const setPlayerVolume = usePlayerStore((s) => s.setVolume);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('silver');
  const [months, setMonths] = useState(1);
  const [paying, setPaying] = useState(false);

  if (!user) return null;

  const paidPlans = plans.filter((plan) => plan.monthlyPrice > 0);
  const selectedPlan = paidPlans.find((plan) => plan.code === selectedTier) ?? paidPlans[0];

  const updateSettings = (patch: Partial<typeof user.settings>) => {
    void saveSettings(patch).catch(() => toast.error(t('common.error')));
  };

  const onDelete = () => {
    void deleteAccount().then(() => {
      toast.success(t('settings.deleted'));
      navigate('/login', { replace: true });
    });
  };

  // The gateway owns the payment page; we only hand off and come back through
  // /payment/callback, which verifies the transaction.
  const startPayment = async () => {
    if (!selectedPlan) return;
    setPaying(true);
    try {
      const data = await request<{ payment_url: string }>('/payments/start/', {
        method: 'POST',
        body: { plan: Number(selectedPlan.id), months },
      });
      window.location.assign(data.payment_url);
    } catch (error) {
      setPaying(false);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-text">{t('settings.title')}</h1>

      <Section icon={<Palette size={18} />} title={t('settings.appearance')}>
        <Row label={t('settings.theme')}>
          <Select
            value={theme}
            onChange={(e) => {
              const next = e.target.value as 'dark' | 'light';
              setTheme(next);
              updateSettings({ theme: next });
            }}
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
            onChange={(e) => {
              const next = e.target.value as 'fa' | 'en';
              setLanguage(next);
              updateSettings({ language: next });
            }}
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
            onChange={(e) => {
              const volume = Number(e.target.value);
              updateSettings({ volume });
              // The system volume drives the music player too.
              setPlayerVolume(volume);
            }}
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
        {user.subscription.expiresAt && (
          <Row label={t('settings.expiresAt')}>
            <span className="text-sm text-muted">
              {formatDate(user.subscription.expiresAt, language)}
            </span>
          </Row>
        )}
        <div className="flex flex-col gap-1">
          <Button variant="secondary" onClick={() => setUpgradeOpen(true)} className="self-start">
            {t('settings.upgrade')}
            <ChevronLeft size={16} className="rtl:rotate-180" />
          </Button>
          <span className="text-xs text-muted">{t('settings.upgradeHint')}</span>
        </div>
      </Section>

      <SupportSection />

      <Section icon={<Trash2 size={18} />} title={t('settings.dangerZone')}>
        <Button variant="danger" onClick={() => setConfirmOpen(true)} className="self-start">
          <Trash2 size={16} />
          {t('settings.deleteAccount')}
        </Button>
      </Section>

      <Modal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title={t('settings.upgrade')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setUpgradeOpen(false)}>
              {t('common.close')}
            </Button>
            <Button onClick={() => void startPayment()} disabled={paying || !selectedPlan}>
              <CreditCard size={16} />
              {t('settings.payNow')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {paidPlans.map((plan) => (
              <button
                key={plan.code}
                type="button"
                onClick={() => setSelectedTier(plan.code)}
                className={
                  plan.code === selectedTier
                    ? 'rounded-2xl border border-accent bg-accent/10 p-3 text-start'
                    : 'rounded-2xl border border-border bg-surface-2 p-3 text-start'
                }
              >
                <p className="font-semibold text-text">{plan.name}</p>
                <p className="text-sm text-muted">
                  {formatCount(plan.monthlyPrice, language)} {plan.currency}
                  {' / '}
                  {t('settings.perMonth')}
                </p>
              </button>
            ))}
          </div>

          <Select
            label={t('settings.duration')}
            value={String(months)}
            onChange={(e) => setMonths(Number(e.target.value))}
            options={MONTH_OPTIONS.map((value) => ({
              value: String(value),
              label: t('settings.monthsCount', { count: value }),
            }))}
          />

          {selectedPlan && (
            <p className="text-sm text-text">
              {t('settings.totalToPay')}:{' '}
              <strong>
                {formatCount(selectedPlan.monthlyPrice * months, language)} {selectedPlan.currency}
              </strong>
            </p>
          )}
          <p className="text-xs text-muted">{t('settings.sandboxHint')}</p>
        </div>
      </Modal>

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
