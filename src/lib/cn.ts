import { clsx, type ClassValue } from 'clsx';

/** Tiny class-name combiner used across UI components. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
