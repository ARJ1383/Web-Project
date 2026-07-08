import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  MessageSquareReply,
  PieChart,
  ShieldCheck,
  Ticket as TicketIcon,
  Users2,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, Input, Modal } from '@/components/ui';
import { useCurrentUser } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { toast } from '@/stores/toastStore';
import { formatCount, formatDate, formatRelative, uid } from '@/lib/format';
import type { Artist, TicketStatus } from '@/types/models';
import { cn } from '@/lib/cn';

type TabKey = 'verification' | 'tickets' | 'audit' | 'pricing';

type TabItem = {
  key: TabKey;
  icon: ReactNode;
  label: string;
};

function SectionShell({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card-surface flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <span className="text-accent">{icon}</span>
          {title}
        </h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card-surface flex flex-col gap-3">
      <div className="flex items-center gap-2 text-muted">
        <span className="text-accent">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-text">{value}</div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function statusTone(status: string) {
  switch (status) {
    case 'settled':
    case 'replied':
    case 'approved':
      return 'success' as const;
    case 'rejected':
    case 'closed':
      return 'danger' as const;
    case 'pending':
    case 'open':
    default:
      return 'accent' as const;
  }
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="input-base min-h-28 resize-y"
    />
  );
}

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation();
  return <Badge tone={statusTone(status)}>{t(`dashboard.ticket.status.${status}`)}</Badge>;
}

function AuditStatusBadge({ status }: { status: 'pending' | 'settled' }) {
  const { t } = useTranslation();
  return <Badge tone={statusTone(status)}>{t(`dashboard.audit.status.${status}`)}</Badge>;
}

function VerificationStatusBadge({ status }: { status: Artist['status'] }) {
  const { t } = useTranslation();
  return <Badge tone={statusTone(status)}>{t(`dashboard.verification.status.${status}`)}</Badge>;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const language = useLanguageStore((s) => s.language);

  const catalogUsers = useCatalogStore((s) => s.users);
  const catalogArtists = useCatalogStore((s) => s.artists);
  const updateArtist = useCatalogStore((s) => s.updateArtist);

  const tickets = useDashboardStore((s) => s.tickets);
  const audits = useDashboardStore((s) => s.auditRecords);
  const pricing = useDashboardStore((s) => s.pricing);
  const replyToTicket = useDashboardStore((s) => s.replyToTicket);
  const closeTicket = useDashboardStore((s) => s.closeTicket);
  const settleAudit = useDashboardStore((s) => s.settleAudit);
  const updatePricing = useDashboardStore((s) => s.updatePricing);

  const addNotification = useNotificationStore((s) => s.add);

  const [tab, setTab] = useState<TabKey>('verification');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [pricingDraft, setPricingDraft] = useState(pricing);

  useEffect(() => {
    setPricingDraft(pricing);
  }, [pricing]);

  const isAdmin = user?.role === 'admin';

  const tabs = useMemo<TabItem[]>(() => {
    const baseTabs: TabItem[] = [
      {
        key: 'verification',
        icon: <ShieldCheck size={16} />,
        label: t('dashboard.tabs.verification'),
      },
      { key: 'tickets', icon: <TicketIcon size={16} />, label: t('dashboard.tabs.tickets') },
    ];

    const adminTabs: TabItem[] = isAdmin
      ? [
          { key: 'audit', icon: <Wallet size={16} />, label: t('dashboard.tabs.audit') },
          { key: 'pricing', icon: <BarChart3 size={16} />, label: t('dashboard.tabs.pricing') },
        ]
      : [];

    return [...baseTabs, ...adminTabs];
  }, [isAdmin, t]);

  useEffect(() => {
    if (!tabs.some((item) => item.key === tab)) setTab(tabs[0]?.key ?? 'verification');
  }, [tab, tabs]);

  const pendingArtists = useMemo(
    () =>
      [...catalogArtists]
        .filter((artist) => artist.status === 'pending')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [catalogArtists],
  );

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  const openTickets = tickets.filter((ticket) => ticket.status !== 'closed');
  const totalPendingPayout = audits
    .filter((record) => record.status === 'pending')
    .reduce((sum, record) => sum + record.rewardAmount, 0);

  const accounts = [...catalogUsers, ...catalogArtists];
  const tierCounts = {
    basic: accounts.filter((acc) => acc.subscription.tier === 'basic').length,
    silver: accounts.filter((acc) => acc.subscription.tier === 'silver').length,
    gold: accounts.filter((acc) => acc.subscription.tier === 'gold').length,
  };
  const totalAccounts = Math.max(1, accounts.length);
  const monthlyRevenue =
    tierCounts.silver * pricing.silverMonthly + tierCounts.gold * pricing.goldMonthly;

  const paymentShare = [
    {
      label: t('dashboard.pricing.basic'),
      count: tierCounts.basic,
      color: 'rgb(148 163 184)',
    },
    {
      label: t('dashboard.pricing.silver'),
      count: tierCounts.silver,
      color: 'rgb(56 189 248)',
    },
    {
      label: t('dashboard.pricing.gold'),
      count: tierCounts.gold,
      color: 'rgb(251 191 36)',
    },
  ];

  if (!user) return null;

  const approveArtist = (artist: Artist) => {
    const now = new Date().toISOString();
    updateArtist(artist.id, {
      status: 'approved',
      verified: true,
      statusReason: t('dashboard.verification.approvedNote'),
    });
    addNotification({
      id: uid('ntf'),
      userId: artist.id,
      type: 'verification_result',
      title: t('dashboard.verification.approvedToastTitle'),
      body: t('dashboard.verification.approvedToastBody'),
      read: false,
      createdAt: now,
    });
    toast.success(t('dashboard.verification.approvedToast'));
    setSelectedArtist(null);
    setRejectReason('');
  };

  const rejectArtist = (artist: Artist) => {
    const now = new Date().toISOString();
    const reason = rejectReason.trim() || t('dashboard.verification.rejectedNote');
    updateArtist(artist.id, {
      status: 'rejected',
      verified: false,
      statusReason: reason,
    });
    addNotification({
      id: uid('ntf'),
      userId: artist.id,
      type: 'verification_result',
      title: t('dashboard.verification.rejectedToastTitle'),
      body: reason,
      read: false,
      createdAt: now,
    });
    toast.error(t('dashboard.verification.rejectedToast'));
    setSelectedArtist(null);
    setRejectReason('');
  };

  const sendReply = () => {
    if (!selectedTicket || !replyDraft.trim()) return;
    replyToTicket(selectedTicket.id, replyDraft.trim(), user.displayName);
    toast.success(t('dashboard.ticket.replySent'));
    setReplyDraft('');
  };

  const savePricing = () => {
    updatePricing({
      silverMonthly: Number(pricingDraft.silverMonthly),
      goldMonthly: Number(pricingDraft.goldMonthly),
      currency: pricingDraft.currency,
    });
    toast.success(t('dashboard.pricing.saved'));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="card-surface flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{t('dashboard.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle')}</p>
          </div>
          <Badge tone={isAdmin ? 'gold' : 'accent'}>
            {isAdmin ? t('dashboard.roles.admin') : t('dashboard.roles.support')}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<BadgeCheck size={18} />}
            label={t('dashboard.stats.pendingArtists')}
            value={String(pendingArtists.length)}
            hint={t('dashboard.stats.pendingArtistsHint')}
          />
          <StatCard
            icon={<TicketIcon size={18} />}
            label={t('dashboard.stats.openTickets')}
            value={String(openTickets.length)}
            hint={t('dashboard.stats.openTicketsHint')}
          />
          <StatCard
            icon={<Wallet size={18} />}
            label={t('dashboard.stats.pendingPayout')}
            value={`${formatCount(totalPendingPayout, language)} ${pricing.currency}`}
            hint={t('dashboard.stats.pendingPayoutHint')}
          />
          <StatCard
            icon={<DollarSign size={18} />}
            label={t('dashboard.stats.monthlyRevenue')}
            value={`${formatCount(monthlyRevenue, language)} ${pricing.currency}`}
            hint={t('dashboard.stats.monthlyRevenueHint')}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button
            key={item.key}
            variant={tab === item.key ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTab(item.key)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </div>

      {tab === 'verification' && (
        <SectionShell
          icon={<ShieldCheck size={18} />}
          title={t('dashboard.verification.title')}
          description={t('dashboard.verification.description')}
        >
          {pendingArtists.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2/60 text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.verification.table.artist')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.verification.table.email')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.verification.table.submitted')}
                    </th>
                    <th className="px-4 py-3 text-end font-medium">
                      {t('dashboard.verification.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingArtists.map((artist) => (
                    <tr key={artist.id} className="border-t border-border hover:bg-surface-2/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={artist.avatarUrl} alt={artist.displayName} size={40} />
                          <div>
                            <p className="font-medium text-text">{artist.artistName}</p>
                            <p className="text-xs text-muted">{artist.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{artist.email}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(artist.createdAt, language)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedArtist(artist);
                            setRejectReason(artist.statusReason ?? '');
                          }}
                        >
                          <Eye size={16} />
                          {t('dashboard.verification.view')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={BadgeCheck}
              title={t('dashboard.verification.empty')}
              description={t('dashboard.verification.emptyDescription')}
            />
          )}
        </SectionShell>
      )}

      {tab === 'tickets' && (
        <SectionShell
          icon={<TicketIcon size={18} />}
          title={t('dashboard.ticket.title')}
          description={t('dashboard.ticket.description')}
        >
          {tickets.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2/60 text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.ticket.table.subject')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.ticket.table.user')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.ticket.table.created')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.ticket.table.status')}
                    </th>
                    <th className="px-4 py-3 text-end font-medium">
                      {t('dashboard.ticket.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-border hover:bg-surface-2/40">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-text">{ticket.subject}</p>
                          <p className="text-xs text-muted">
                            {t('dashboard.ticket.messagesCount', { count: ticket.messages.length })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{ticket.userName}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatRelative(ticket.createdAt, language)}
                      </td>
                      <td className="px-4 py-3">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedTicketId(ticket.id);
                            setReplyDraft('');
                          }}
                        >
                          <MessageSquareReply size={16} />
                          {t('dashboard.ticket.openThread')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={TicketIcon}
              title={t('dashboard.ticket.empty')}
              description={t('dashboard.ticket.emptyDescription')}
            />
          )}
        </SectionShell>
      )}

      {tab === 'audit' && isAdmin && (
        <SectionShell
          icon={<Wallet size={18} />}
          title={t('dashboard.audit.title')}
          description={t('dashboard.audit.description')}
        >
          {audits.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2/60 text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.audit.table.artist')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.audit.table.uniqueListeners')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.audit.table.monthlyStreams')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.audit.table.reward')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('dashboard.audit.table.status')}
                    </th>
                    <th className="px-4 py-3 text-end font-medium">
                      {t('dashboard.audit.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((record) => (
                    <tr key={record.id} className="border-t border-border hover:bg-surface-2/40">
                      <td className="px-4 py-3 font-medium text-text">{record.artistName}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatCount(record.uniqueListeners, language)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatCount(record.monthlyStreams, language)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatCount(record.rewardAmount, language)} {pricing.currency}
                      </td>
                      <td className="px-4 py-3">
                        <AuditStatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button
                          size="sm"
                          variant={record.status === 'settled' ? 'secondary' : 'primary'}
                          disabled={record.status === 'settled'}
                          onClick={() => {
                            settleAudit(record.id);
                            toast.success(t('dashboard.audit.settledToast'));
                          }}
                        >
                          <CheckCircle2 size={16} />
                          {record.status === 'settled'
                            ? t('dashboard.audit.settled')
                            : t('dashboard.audit.settle')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Wallet}
              title={t('dashboard.audit.empty')}
              description={t('dashboard.audit.emptyDescription')}
            />
          )}
        </SectionShell>
      )}

      {tab === 'pricing' && isAdmin && (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionShell
            icon={<BarChart3 size={18} />}
            title={t('dashboard.pricing.title')}
            description={t('dashboard.pricing.description')}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="number"
                min={0}
                value={pricingDraft.silverMonthly}
                onChange={(e) =>
                  setPricingDraft((state) => ({ ...state, silverMonthly: Number(e.target.value) }))
                }
                label={t('dashboard.pricing.silverMonthly')}
              />
              <Input
                type="number"
                min={0}
                value={pricingDraft.goldMonthly}
                onChange={(e) =>
                  setPricingDraft((state) => ({ ...state, goldMonthly: Number(e.target.value) }))
                }
                label={t('dashboard.pricing.goldMonthly')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={savePricing}>
                <FileText size={16} />
                {t('dashboard.pricing.save')}
              </Button>
              <p className="text-xs text-muted">{t('dashboard.pricing.saveHint')}</p>
            </div>
          </SectionShell>

          <SectionShell
            icon={<PieChart size={18} />}
            title={t('dashboard.pricing.chartTitle')}
            description={t('dashboard.pricing.chartDescription')}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative h-44 w-44 rounded-full border border-border"
                style={{
                  background: `conic-gradient(
                    ${paymentShare[0].color} 0 ${((paymentShare[0].count / totalAccounts) * 100).toFixed(2)}%,
                    ${paymentShare[1].color} ${((paymentShare[0].count / totalAccounts) * 100).toFixed(2)}% ${(
                      ((paymentShare[0].count + paymentShare[1].count) / totalAccounts) *
                      100
                    ).toFixed(2)}%,
                    ${paymentShare[2].color} ${(
                      ((paymentShare[0].count + paymentShare[1].count) / totalAccounts) *
                      100
                    ).toFixed(2)}% 100%
                  )`,
                }}
              >
                <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-surface text-center">
                  <span className="text-xs text-muted">{t('dashboard.pricing.totalAccounts')}</span>
                  <span className="text-2xl font-extrabold text-text">
                    {formatCount(totalAccounts, language)}
                  </span>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3">
                {paymentShare.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border bg-surface-2 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span className="text-sm font-medium text-text">{item.label}</span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-text">
                      {formatCount(item.count, language)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>

          <div className="grid gap-4 xl:col-span-2 xl:grid-cols-4">
            <StatCard
              icon={<Users2 size={18} />}
              label={t('dashboard.pricing.basic')}
              value={formatCount(tierCounts.basic, language)}
            />
            <StatCard
              icon={<Users2 size={18} />}
              label={t('dashboard.pricing.silver')}
              value={formatCount(tierCounts.silver, language)}
            />
            <StatCard
              icon={<Users2 size={18} />}
              label={t('dashboard.pricing.gold')}
              value={formatCount(tierCounts.gold, language)}
            />
            <StatCard
              icon={<DollarSign size={18} />}
              label={t('dashboard.pricing.monthlyRevenue')}
              value={`${formatCount(monthlyRevenue, language)} ${pricing.currency}`}
            />
          </div>
        </div>
      )}

      {!isAdmin && tab !== 'verification' && tab !== 'tickets' && (
        <EmptyState
          icon={ShieldCheck}
          title={t('dashboard.access.supportOnlyTitle')}
          description={t('dashboard.access.supportOnlyDescription')}
        />
      )}

      <Modal
        open={!!selectedArtist}
        onClose={() => {
          setSelectedArtist(null);
          setRejectReason('');
        }}
        title={t('dashboard.verification.detailsTitle')}
        className="max-w-3xl"
        footer={
          selectedArtist ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedArtist(null);
                  setRejectReason('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={() => rejectArtist(selectedArtist)}>
                <XCircle size={16} />
                {t('dashboard.verification.reject')}
              </Button>
              <Button onClick={() => approveArtist(selectedArtist)}>
                <CheckCircle2 size={16} />
                {t('dashboard.verification.approve')}
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedArtist && (
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-center">
              <Avatar src={selectedArtist.avatarUrl} alt={selectedArtist.displayName} size={96} />
              <div>
                <p className="text-lg font-semibold text-text">{selectedArtist.artistName}</p>
                <p className="text-sm text-muted">{selectedArtist.email}</p>
              </div>
              <VerificationStatusBadge status={selectedArtist.status} />
              <div className="w-full rounded-xl bg-surface p-3 text-start text-sm text-muted">
                <p className="font-medium text-text">{t('dashboard.verification.submitted')}</p>
                <p>{formatDate(selectedArtist.createdAt, language)}</p>
              </div>
              {selectedArtist.portfolioUrl ? (
                <a
                  href={selectedArtist.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {t('dashboard.verification.openPortfolio')}
                </a>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-sm font-medium text-text">{t('dashboard.verification.bio')}</p>
                <p className="mt-2 text-sm text-muted">
                  {selectedArtist.bio || t('dashboard.verification.noBio')}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="reject-reason">
                  {t('dashboard.verification.rejectReason')}
                </label>
                <TextArea
                  value={rejectReason}
                  onChange={setRejectReason}
                  placeholder={t('dashboard.verification.rejectReasonPlaceholder')}
                  rows={5}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-surface-2 p-3">
                  <p className="text-xs text-muted">{t('dashboard.verification.followers')}</p>
                  <p className="mt-1 text-lg font-bold text-text">
                    {formatCount(selectedArtist.followerIds.length, language)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-2 p-3">
                  <p className="text-xs text-muted">{t('dashboard.verification.listeners')}</p>
                  <p className="mt-1 text-lg font-bold text-text">
                    {formatCount(selectedArtist.totalListeners, language)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-2 p-3">
                  <p className="text-xs text-muted">{t('dashboard.verification.streams')}</p>
                  <p className="mt-1 text-lg font-bold text-text">
                    {formatCount(selectedArtist.totalStreams, language)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!selectedTicket}
        onClose={() => setSelectedTicketId(null)}
        title={t('dashboard.ticket.threadTitle')}
        className="max-w-3xl"
        footer={
          selectedTicket ? (
            <>
              <Button variant="secondary" onClick={() => setSelectedTicketId(null)}>
                {t('common.close')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  closeTicket(selectedTicket.id);
                  toast.success(t('dashboard.ticket.closedToast'));
                  setSelectedTicketId(null);
                }}
              >
                {t('dashboard.ticket.close')}
              </Button>
              <Button onClick={sendReply} disabled={!replyDraft.trim()}>
                <MessageSquareReply size={16} />
                {t('dashboard.ticket.reply')}
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedTicket && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-text">{selectedTicket.subject}</p>
                  <p className="text-sm text-muted">
                    {selectedTicket.userName} · {formatDate(selectedTicket.createdAt, language)}
                  </p>
                </div>
                <TicketStatusBadge status={selectedTicket.status} />
              </div>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
              {selectedTicket.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1 rounded-2xl p-3 text-sm',
                    message.senderRole === 'support'
                      ? 'ms-auto max-w-[85%] bg-accent/15 text-text'
                      : 'me-auto max-w-[85%] bg-surface-2 text-text',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted">
                    <span>{message.senderName}</span>
                    <span>{formatRelative(message.createdAt, language)}</span>
                  </div>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text" htmlFor="ticket-reply">
                {t('dashboard.ticket.replyLabel')}
              </label>
              <TextArea
                value={replyDraft}
                onChange={setReplyDraft}
                placeholder={t('dashboard.ticket.replyPlaceholder')}
                rows={4}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
