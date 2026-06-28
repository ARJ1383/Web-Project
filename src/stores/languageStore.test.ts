import { describe, it, expect } from 'vitest';
import { useLanguageStore } from './languageStore';

describe('languageStore', () => {
  it('sets dir=rtl for Persian and ltr for English', () => {
    useLanguageStore.getState().setLanguage('fa');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('fa');

    useLanguageStore.getState().setLanguage('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('toggles language', () => {
    useLanguageStore.getState().setLanguage('fa');
    useLanguageStore.getState().toggleLanguage();
    expect(useLanguageStore.getState().language).toBe('en');
  });
});
