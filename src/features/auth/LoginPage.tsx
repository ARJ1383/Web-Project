import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from './AuthShell';
import { loginSchema, fieldErrors } from './schema';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toastStore';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  if (currentUserId) return <Navigate to="/" replace />;

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const result = login(email, password);
    if (!result.ok) {
      setFormError(t(result.error));
      return;
    }
    toast.success(t('home.greeting', { name: result.user.displayName }));
    navigate(from, { replace: true });
  };

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          type="email"
          label={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email ? t(errors.email) : undefined}
          autoComplete="email"
        />
        <Input
          type="password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password ? t(errors.password) : undefined}
          autoComplete="current-password"
        />

        {formError && <p className="text-sm text-danger">{formError}</p>}

        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="self-start text-xs text-accent hover:underline"
        >
          {t('auth.forgotPassword')}
        </button>

        <Button type="submit" size="lg" className="w-full">
          {t('auth.login')}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-accent hover:underline">
          {t('auth.register')}
        </Link>
      </p>

      <div className="mt-5 rounded-xl bg-surface-2 p-3 text-xs text-muted">
        <p className="mb-1 font-semibold text-text">{t('auth.demoHint')}</p>
        <ul className="space-y-0.5">
          <li>sara@trimir.app · nina@trimir.app · ali@trimir.app</li>
          <li>aurora@trimir.app · support@trimir.app · admin@trimir.app</li>
        </ul>
      </div>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title={t('auth.forgotPassword')}
        footer={<Button onClick={() => setForgotOpen(false)}>{t('common.close')}</Button>}
      >
        <p className="text-sm text-muted">{t('auth.forgotInfo')}</p>
      </Modal>
    </AuthShell>
  );
}
