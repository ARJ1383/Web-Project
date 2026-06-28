/**
 * Typed wrapper around Local Storage.
 *
 * Phase 1 keeps all mock data in the browser (PDF note #13). Zustand's
 * `persist` middleware uses a `StateStorage` adapter that delegates here so we
 * have one place that talks to `window.localStorage` (easy to swap for the real
 * API in Phase 2).
 */
import type { StateStorage } from 'zustand/middleware';

export const STORAGE_KEYS = {
  db: 'trimir:db',
  auth: 'trimir:auth',
  theme: 'trimir:theme',
  language: 'trimir:language',
  playlists: 'trimir:playlists',
  notifications: 'trimir:notifications',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / serialization errors in the mock layer */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

/** Adapter for Zustand `persist`. */
export const zustandStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};
