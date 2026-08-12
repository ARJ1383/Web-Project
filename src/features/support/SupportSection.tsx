import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, Send } from 'lucide-react';
import { Badge, Button, Input, Modal } from '@/components/ui';
import { request, requestAll } from '@/lib/api';
import { toTicket, type ApiTicket } from '@/lib/mappers';
import { formatRelative } from '@/lib/format';
import { useLanguageStore } from '@/stores/languageStore';
import { toast } from '@/stores/toastStore';
import type { SupportTicket } from '@/types/models';

/** Lets a user open a support ticket and follow the replies (PDF §2.11.1). */
export function SupportSection() {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = () =>
    requestAll<ApiTicket>('/tickets/')
      .then((data) => setTickets(data.map(toTicket)))
      .catch(() => setTickets([]));

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    setSending(true);
    try {
      await request('/tickets/', { method: 'POST', body: { subject, body } });
      await load();
      toast.success(t('support.sent'));
      setSubject('');
      setBody('');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card-surface flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
        <span className="text-accent">
          <LifeBuoy size={18} />
        </span>
        {t('support.title')}
      </h2>

      {tickets.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-2xl border border-border bg-surface-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-text">{ticket.subject}</p>
                <Badge tone={ticket.status === 'closed' ? 'danger' : 'accent'}>
                  {t(`dashboard.ticket.status.${ticket.status}`)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatRelative(ticket.updatedAt, language)} ·{' '}
                {t('dashboard.ticket.messagesCount', { count: ticket.messages.length })}
              </p>
              <p className="mt-2 text-sm text-muted">
                {ticket.messages[ticket.messages.length - 1]?.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t('support.empty')}</p>
      )}

      <Button variant="secondary" className="self-start" onClick={() => setOpen(true)}>
        <Send size={16} />
        {t('support.newTicket')}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('support.newTicket')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => void submit()}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {t('support.send')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label={t('support.subject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">{t('support.message')}</span>
            <textarea
              className="input-base min-h-28 resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
        </div>
      </Modal>
    </section>
  );
}
