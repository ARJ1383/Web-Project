import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { request } from '@/lib/api';
import { Button, Spinner } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

/** Landing page the payment gateway returns to; it verifies the transaction. */
export function PaymentCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const refreshCurrentUser = useAuthStore((s) => s.refreshCurrentUser);
  const [state, setState] = useState<'pending' | 'paid' | 'failed'>('pending');
  const verified = useRef(false);

  useEffect(() => {
    const authority = params.get('Authority') ?? params.get('authority');
    const status = params.get('Status') ?? params.get('status') ?? 'OK';
    if (!authority || verified.current) {
      if (!authority) setState('failed');
      return;
    }
    verified.current = true;
    request('/payments/verify/', { method: 'POST', body: { authority, status } })
      .then(async () => {
        await refreshCurrentUser();
        setState('paid');
      })
      .catch(() => setState('failed'));
  }, [params, refreshCurrentUser]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {state === 'pending' && <Spinner />}
      {state === 'paid' && <CheckCircle2 size={48} className="text-success" />}
      {state === 'failed' && <XCircle size={48} className="text-danger" />}

      <h1 className="text-xl font-bold text-text">{t(`payment.${state}Title`)}</h1>
      <p className="text-sm text-muted">{t(`payment.${state}Body`)}</p>

      {state !== 'pending' && (
        <Button onClick={() => navigate('/settings', { replace: true })}>
          {t('payment.backToSettings')}
        </Button>
      )}
    </div>
  );
}
