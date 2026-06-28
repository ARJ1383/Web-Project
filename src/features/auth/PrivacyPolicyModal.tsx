import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@/components/ui';

export function PrivacyPolicyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('auth.privacyPolicy')}
      footer={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      <div className="space-y-3 text-sm leading-6 text-muted">
        <p>
          {t('app.name')} — {t('app.tagline')}.
        </p>
        <p>
          We collect only the information needed to provide the service: your email, display name,
          and listening activity. In this phase the data lives in your browser (Local Storage) and
          never leaves your device.
        </p>
        <p>
          You can delete your account and all associated data at any time from the Settings page. We
          do not sell your data to third parties.
        </p>
        <p>By creating an account you agree to these terms.</p>
      </div>
    </Modal>
  );
}
