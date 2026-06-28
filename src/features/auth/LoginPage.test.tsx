import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithRouter, screen, userEvent } from '@/test/test-utils';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '@/stores/authStore';
import { applyLanguage } from '@/stores/languageStore';

beforeEach(() => {
  applyLanguage('en');
  useAuthStore.setState({ currentUserId: null });
});

describe('LoginPage', () => {
  it('shows validation errors when submitting an empty form', async () => {
    renderWithRouter(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getAllByText('This field is required.').length).toBeGreaterThan(0);
  });

  it('shows an error for invalid credentials', async () => {
    renderWithRouter(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'nobody@trimir.app');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
  });
});
