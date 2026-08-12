import { create } from 'zustand';
import { request, requestAll } from '@/lib/api';
import {
  toAuditRecord,
  toOverview,
  toTicket,
  type ApiOverview,
  type ApiPayout,
  type ApiTicket,
} from '@/lib/mappers';
import { applyPlans, type ApiPlan } from '@/lib/subscription';
import type { AdminOverview, AuditRecord, PricingSettings, SupportTicket } from '@/types/models';

interface DashboardState {
  tickets: SupportTicket[];
  auditRecords: AuditRecord[];
  pricing: PricingSettings;
  overview: AdminOverview | null;

  hydrate: (options?: { admin?: boolean }) => Promise<void>;
  replyToTicket: (ticketId: string, message: string) => Promise<void>;
  closeTicket: (ticketId: string) => Promise<void>;
  settleAudit: (auditId: string) => Promise<void>;
  updatePricing: (patch: Partial<PricingSettings>) => Promise<void>;
}

const initialPricing: PricingSettings = {
  silverMonthly: 0,
  goldMonthly: 0,
  currency: 'تومان',
  silverPlanId: '',
  goldPlanId: '',
};

function pricingFromPlans(plans: ApiPlan[]): PricingSettings {
  const silver = plans.find((plan) => plan.code === 'silver');
  const gold = plans.find((plan) => plan.code === 'gold');
  return {
    silverMonthly: Number(silver?.monthly_price ?? 0),
    goldMonthly: Number(gold?.monthly_price ?? 0),
    currency: gold?.currency ?? silver?.currency ?? 'تومان',
    silverPlanId: String(silver?.id ?? ''),
    goldPlanId: String(gold?.id ?? ''),
  };
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  tickets: [],
  auditRecords: [],
  pricing: initialPricing,
  overview: null,

  hydrate: async ({ admin = false } = {}) => {
    const [tickets, plans, overview] = await Promise.all([
      requestAll<ApiTicket>('/tickets/'),
      requestAll<ApiPlan>('/subscription-plans/'),
      request<ApiOverview>('/reports/overview/'),
    ]);
    applyPlans(plans);
    set({
      tickets: tickets.map(toTicket),
      pricing: pricingFromPlans(plans),
      overview: toOverview(overview),
    });

    if (admin) {
      const payouts = await requestAll<ApiPayout>('/reports/payouts/');
      set({ auditRecords: payouts.map(toAuditRecord) });
    }
  },

  replyToTicket: async (ticketId, message) => {
    const data = await request<ApiTicket>(`/tickets/${ticketId}/reply/`, {
      method: 'POST',
      body: { body: message.trim() },
    });
    const ticket = toTicket(data);
    set((s) => ({ tickets: s.tickets.map((item) => (item.id === ticketId ? ticket : item)) }));
  },

  closeTicket: async (ticketId) => {
    const data = await request<ApiTicket>(`/tickets/${ticketId}/close/`, { method: 'POST' });
    const ticket = toTicket(data);
    set((s) => ({ tickets: s.tickets.map((item) => (item.id === ticketId ? ticket : item)) }));
  },

  settleAudit: async (auditId) => {
    const data = await request<ApiPayout>(`/reports/payouts/${auditId}/settle/`, {
      method: 'POST',
    });
    const record = toAuditRecord(data);
    set((s) => ({
      auditRecords: s.auditRecords.map((item) => (item.id === auditId ? record : item)),
    }));
  },

  updatePricing: async (patch) => {
    const { pricing } = get();
    const updates: Promise<ApiPlan>[] = [];
    if (patch.silverMonthly !== undefined && pricing.silverPlanId) {
      updates.push(
        request<ApiPlan>(`/subscription-plans/${pricing.silverPlanId}/`, {
          method: 'PATCH',
          body: { monthly_price: String(patch.silverMonthly), currency: patch.currency },
        }),
      );
    }
    if (patch.goldMonthly !== undefined && pricing.goldPlanId) {
      updates.push(
        request<ApiPlan>(`/subscription-plans/${pricing.goldPlanId}/`, {
          method: 'PATCH',
          body: { monthly_price: String(patch.goldMonthly), currency: patch.currency },
        }),
      );
    }
    await Promise.all(updates);
    const plans = await requestAll<ApiPlan>('/subscription-plans/');
    applyPlans(plans);
    set({ pricing: pricingFromPlans(plans) });
  },
}));
