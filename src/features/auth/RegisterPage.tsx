import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from './AuthShell';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { registerSchema, artistRegisterSchema, fieldErrors, type RegisterValues } from './schema';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Select } from '@/components/ui';
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/cn';
import type { Gender } from '@/types/models';

type Mode = 'listener' | 'artist';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, registerArtist, currentUserId } = useAuthStore();

  const [mode, setMode] = useState<Mode>('listener');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // listener fields
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: 'unspecified' as Gender,
    acceptPrivacy: false,
  });
  // artist fields
  const [artist, setArtist] = useState({
    artistName: '',
    email: '',
    password: '',
    portfolioUrl: '',
  });

  if (currentUserId) return <Navigate to="/" replace />;

  const setField = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submitListener = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = registerSchema.safeParse(form as RegisterValues);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const result = register({
      displayName: form.displayName,
      email: form.email,
      password: form.password,
      birthDate: form.birthDate || undefined,
      gender: form.gender,
    });
    if (!result.ok) {
      setFormError(t(result.error));
      return;
    }
    toast.success(t('profile.saved'));
    navigate('/', { replace: true });
  };

  const submitArtist = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = artistRegisterSchema.safeParse(artist);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const result = registerArtist({
      artistName: artist.artistName,
      email: artist.email,
      password: artist.password,
      portfolioUrl: artist.portfolioUrl || undefined,
    });
    if (!result.ok) {
      setFormError(t(result.error));
      return;
    }
    toast.success(t('auth.artistPending'));
    navigate('/', { replace: true });
  };

  const err = (k: string) => (errors[k] ? t(errors[k]) : undefined);

  return (
    <AuthShell title={t('auth.registerTitle')}>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {(['listener', 'artist'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setErrors({});
              setFormError(null);
            }}
            className={cn(
              'rounded-lg py-2 text-sm font-medium transition-colors',
              mode === m ? 'bg-accent text-white shadow-glow-sm' : 'text-muted hover:text-text',
            )}
          >
            {t(m === 'listener' ? 'auth.asListener' : 'auth.asArtist')}
          </button>
        ))}
      </div>

      {mode === 'listener' ? (
        <form onSubmit={submitListener} className="flex flex-col gap-3" noValidate>
          <Input
            label={t('auth.displayName')}
            value={form.displayName}
            onChange={(e) => setField('displayName', e.target.value)}
            error={err('displayName')}
          />
          <Input
            type="email"
            label={t('auth.email')}
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={err('email')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="password"
              label={t('auth.password')}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              error={err('password')}
            />
            <Input
              type="password"
              label={t('auth.confirmPassword')}
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              error={err('confirmPassword')}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="date"
              label={t('auth.birthDate')}
              value={form.birthDate}
              onChange={(e) => setField('birthDate', e.target.value)}
            />
            <Select
              label={t('auth.gender')}
              value={form.gender}
              onChange={(e) => setField('gender', e.target.value)}
              options={[
                { value: 'unspecified', label: t('auth.genderUnspecified') },
                { value: 'male', label: t('auth.genderMale') },
                { value: 'female', label: t('auth.genderFemale') },
                { value: 'other', label: t('auth.genderOther') },
              ]}
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.acceptPrivacy}
              onChange={(e) => setField('acceptPrivacy', e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent"
            />
            <span>
              {t('auth.acceptPrivacyPrefix')}{' '}
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="font-medium text-accent hover:underline"
              >
                {t('auth.privacyPolicy')}
              </button>
            </span>
          </label>
          {err('acceptPrivacy') && <p className="text-xs text-danger">{err('acceptPrivacy')}</p>}

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <Button type="submit" size="lg" className="mt-1 w-full">
            {t('auth.register')}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitArtist} className="flex flex-col gap-3" noValidate>
          <Input
            label={t('auth.artistName')}
            value={artist.artistName}
            onChange={(e) => setArtist((a) => ({ ...a, artistName: e.target.value }))}
            error={err('artistName')}
          />
          <Input
            type="email"
            label={t('auth.email')}
            value={artist.email}
            onChange={(e) => setArtist((a) => ({ ...a, email: e.target.value }))}
            error={err('email')}
          />
          <Input
            type="password"
            label={t('auth.password')}
            value={artist.password}
            onChange={(e) => setArtist((a) => ({ ...a, password: e.target.value }))}
            error={err('password')}
          />
          <Input
            label={t('auth.portfolio')}
            value={artist.portfolioUrl}
            onChange={(e) => setArtist((a) => ({ ...a, portfolioUrl: e.target.value }))}
            error={err('portfolioUrl')}
            hint={t('common.optional')}
            placeholder="https://"
          />

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <Button type="submit" size="lg" className="mt-1 w-full">
            {t('auth.register')}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          {t('auth.login')}
        </Link>
      </p>

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </AuthShell>
  );
}
