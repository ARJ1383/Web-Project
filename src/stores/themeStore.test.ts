import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';

beforeEach(() => {
  useThemeStore.setState({ theme: 'dark' });
});

describe('themeStore', () => {
  it('reflects the chosen theme on <html data-theme>', () => {
    useThemeStore.getState().setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggles between dark and light', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
