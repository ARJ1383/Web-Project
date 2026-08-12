import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter, screen, userEvent } from '@/test/test-utils';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '@/stores/authStore';
import { applyLanguage } from '@/stores/languageStore';
import { mockApi } from '@/test/api-mock';

beforeEach(() => {
  vi.unstubAllGlobals();
  applyLanguage('en');
  useAuthStore.setState({ currentUser: null, ready: true });
});

describe('LoginPage', () => {
  it('shows validation errors when submitting an empty form', async () => {
    renderWithRouter(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getAllByText('This field is required.').length).toBeGreaterThan(0);
  });

  it('shows an error for invalid credentials', async () => {
    mockApi({
      'POST /auth/login/': { status: 400, body: { detail: 'Invalid email or password.' } },
    });
    renderWithRouter(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'nobody@trimir.app');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
  });
});
