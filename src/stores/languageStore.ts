import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, zustandStorage } from '@/lib/storage';
import i18n, { type Language } from '@/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

/** Apply language to <html lang/dir> and i18next. */
export function applyLanguage(language: Language): void {
  const dir = language === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('lang', language);
  document.documentElement.setAttribute('dir', dir);
  void i18n.changeLanguage(language);
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'fa',
      setLanguage: (language) => {
        applyLanguage(language);
        set({ language });
      },
      toggleLanguage: () => get().setLanguage(get().language === 'fa' ? 'en' : 'fa'),
    }),
    {
      name: STORAGE_KEYS.language,
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) applyLanguage(state.language);
      },
    },
  ),
);
