import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-extrabold text-accent">404</p>
      <h1 className="text-xl font-semibold text-text">{t('errors.notFound')}</h1>
      <Link to="/">
        <Button>{t('errors.goHome')}</Button>
      </Link>
    </div>
  );
}
