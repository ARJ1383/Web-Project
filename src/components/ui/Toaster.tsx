import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/stores/toastStore';
import { cn } from '@/lib/cn';

const icons: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const tones: Record<ToastVariant, string> = {
  default: 'text-accent',
  success: 'text-success',
  error: 'text-danger',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return createPortal(
    <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant];
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className="animate-fade-in flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text shadow-glow-sm"
          >
            <Icon size={18} className={cn(tones[t.variant])} />
            {t.message}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
