/**
 * Typed wrapper around Local Storage.
 *
 * Application data lives in the backend; only device-local preferences (theme,
 * language) are cached here through Zustand's `persist` middleware.
 */
import type { StateStorage } from 'zustand/middleware';

export const STORAGE_KEYS = {
  theme: 'trimir:theme',
  language: 'trimir:language',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Adapter for Zustand `persist`. */
export const zustandStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};
