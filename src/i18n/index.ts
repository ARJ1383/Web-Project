import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fa from './locales/fa.json';
import en from './locales/en.json';
import { readJSON, STORAGE_KEYS } from '@/lib/storage';

export type Language = 'fa' | 'en';

const persisted = readJSON<{ state?: { language?: Language } }>(STORAGE_KEYS.language, {});
const initialLanguage: Language = persisted.state?.language ?? 'fa';

void i18n.use(initReactI18next).init({
  resources: {
    fa: { translation: fa },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
