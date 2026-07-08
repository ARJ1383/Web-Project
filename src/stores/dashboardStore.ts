import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, zustandStorage } from '@/lib/storage';
import { buildSeedDatabase } from '@/lib/seed';
import { uid } from '@/lib/format';
import type {
  AuditRecord,
  PricingSettings,
  SupportTicket,
  SupportTicketMessage,
} from '@/types/models';

interface DashboardState {
  tickets: SupportTicket[];
  auditRecords: AuditRecord[];
  pricing: PricingSettings;

  getTickets: () => SupportTicket[];
  getTicketById: (id: string) => SupportTicket | undefined;
  replyToTicket: (ticketId: string, message: string, responderName: string) => void;
  closeTicket: (ticketId: string) => void;

  getAuditRecords: () => AuditRecord[];
  settleAudit: (auditId: string) => void;

  updatePricing: (patch: Partial<PricingSettings>) => void;
}

function calcPayout(uniqueListeners: number, monthlyStreams: number): number {
  return Math.round(uniqueListeners * 92 + monthlyStreams * 4.2);
}

function buildTickets(): SupportTicket[] {
  return [
    {
      id: 'ticket_subscription',
      userId: 'user_ali',
      userName: 'علی رضایی',
      subject: 'مشکل در ارتقای اشتراک',
      status: 'open',
      createdAt: '2026-06-02T09:10:00.000Z',
      updatedAt: '2026-06-02T09:10:00.000Z',
      messages: [
        {
          id: 'ticket_subscription_msg_1',
          senderRole: 'user',
          senderName: 'علی رضایی',
          body: 'من می‌خواهم اشتراک خودم را ارتقا بدهم، اما صفحه پرداخت برایم باز نمی‌شود.',
          createdAt: '2026-06-02T09:10:00.000Z',
        },
      ],
    },
    {
      id: 'ticket_playlist',
      userId: 'user_sara',
      userName: 'سارا محمدی',
      subject: 'پلی‌لیست جدید ساخته نمی‌شود',
      status: 'replied',
      createdAt: '2026-06-01T14:30:00.000Z',
      updatedAt: '2026-06-02T08:00:00.000Z',
      messages: [
        {
          id: 'ticket_playlist_msg_1',
          senderRole: 'user',
          senderName: 'سارا محمدی',
          body: 'وقتی پلی‌لیست جدید می‌سازم، بعد از زدن دکمه ایجاد هیچ اتفاقی نمی‌افتد.',
          createdAt: '2026-06-01T14:30:00.000Z',
        },
        {
          id: 'ticket_playlist_msg_2',
          senderRole: 'support',
          senderName: 'تیم پشتیبانی',
          body: 'داده‌های مرورگر را پاک کنید و دوباره امتحان کنید. اگر مشکل باقی ماند، نسخه مرورگر را ارسال کنید.',
          createdAt: '2026-06-02T08:00:00.000Z',
        },
      ],
    },
    {
      id: 'ticket_artist_request',
      userId: 'artist_mehr',
      userName: 'مهر',
      subject: 'درخواست بررسی نمونه‌کار',
      status: 'closed',
      createdAt: '2026-06-02T11:15:00.000Z',
      updatedAt: '2026-06-02T15:40:00.000Z',
      messages: [
        {
          id: 'ticket_artist_request_msg_1',
          senderRole: 'user',
          senderName: 'مهر',
          body: 'نمونه‌کارهای من آماده است؛ لطفاً برای تایید حساب هنری بررسی بفرمایید.',
          createdAt: '2026-06-02T11:15:00.000Z',
        },
        {
          id: 'ticket_artist_request_msg_2',
          senderRole: 'support',
          senderName: 'تیم پشتیبانی',
          body: 'ارسال شد. نتیجه پس از بررسی در اعلان‌ها ثبت می‌شود.',
          createdAt: '2026-06-02T15:40:00.000Z',
        },
      ],
    },
  ];
}

function buildAuditRecords(): AuditRecord[] {
  const seed = buildSeedDatabase();
  const monthLabel = '2026-06';

  return seed.artists
    .filter((artist) => artist.status !== 'pending')
    .map((artist, index) => {
      const uniqueListeners = Math.max(
        0,
        Math.round(artist.totalListeners * (0.72 + index * 0.03)),
      );
      const monthlyStreams = Math.max(0, Math.round(artist.totalStreams * 0.18));
      const rewardAmount = calcPayout(uniqueListeners, monthlyStreams);

      return {
        id: `audit_${artist.id}_${monthLabel}`,
        artistId: artist.id,
        artistName: artist.artistName,
        uniqueListeners,
        monthlyStreams,
        rewardAmount,
        status: index === 0 ? 'settled' : 'pending',
        monthLabel,
        settledAt: index === 0 ? '2026-06-05T09:00:00.000Z' : null,
      } satisfies AuditRecord;
    });
}

const initialPricing: PricingSettings = {
  silverMonthly: 129_000,
  goldMonthly: 199_000,
  currency: 'تومان',
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      tickets: buildTickets(),
      auditRecords: buildAuditRecords(),
      pricing: initialPricing,

      getTickets: () =>
        [...get().tickets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),

      getTicketById: (id) => get().tickets.find((ticket) => ticket.id === id),

      replyToTicket: (ticketId, message, responderName) =>
        set((state) => ({
          tickets: state.tickets.map((ticket): SupportTicket => {
            if (ticket.id !== ticketId) return ticket;

            const now = new Date().toISOString();

            const newMessage: SupportTicketMessage = {
              id: uid('ticket_msg'),
              senderRole: 'support',
              senderName: responderName,
              body: message.trim(),
              createdAt: now,
            };

            const nextMessages: SupportTicketMessage[] = [...ticket.messages, newMessage];

            return {
              ...ticket,
              status: ticket.status === 'closed' ? 'closed' : 'replied',
              updatedAt: now,
              messages: nextMessages,
            };
          }),
        })),

      closeTicket: (ticketId) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? { ...ticket, status: 'closed', updatedAt: new Date().toISOString() }
              : ticket,
          ),
        })),

      getAuditRecords: () =>
        [...get().auditRecords].sort((a, b) => +new Date(b.monthLabel) - +new Date(a.monthLabel)),

      settleAudit: (auditId) =>
        set((state) => ({
          auditRecords: state.auditRecords.map((record) =>
            record.id === auditId
              ? { ...record, status: 'settled', settledAt: new Date().toISOString() }
              : record,
          ),
        })),

      updatePricing: (patch) =>
        set((state) => ({
          pricing: { ...state.pricing, ...patch },
        })),
    }),
    {
      name: STORAGE_KEYS.dashboard,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        tickets: state.tickets,
        auditRecords: state.auditRecords,
        pricing: state.pricing,
      }),
    },
  ),
);
