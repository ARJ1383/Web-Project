import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'default' | 'accent' | 'gold' | 'silver' | 'success' | 'danger';

const tones: Record<Tone, string> = {
  default: 'bg-surface-2 text-muted',
  accent: 'bg-accent/15 text-accent',
  gold: 'bg-amber-400/15 text-amber-400',
  silver: 'bg-slate-300/15 text-slate-300',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
};

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
