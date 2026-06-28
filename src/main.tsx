import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './i18n';
import { App } from './app/App';
import { applyTheme, useThemeStore } from './stores/themeStore';
import { applyLanguage, useLanguageStore } from './stores/languageStore';

// Apply persisted preferences before first paint.
applyTheme(useThemeStore.getState().theme);
applyLanguage(useLanguageStore.getState().language);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
