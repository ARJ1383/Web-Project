import { cn } from '@/lib/cn';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

const DEFAULT_AVATAR = '/default-avatar.svg';

export function Avatar({ src, alt, size = 40, className }: AvatarProps) {
  return (
    <img
      src={src || DEFAULT_AVATAR}
      alt={alt}
      width={size}
      height={size}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
      }}
      className={cn('rounded-full border border-border bg-surface-2 object-cover', className)}
      style={{ width: size, height: size }}
    />
  );
}
