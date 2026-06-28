import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithRouter, screen, userEvent } from '@/test/test-utils';
import { RegisterPage } from './RegisterPage';
import { useAuthStore } from '@/stores/authStore';
import { applyLanguage } from '@/stores/languageStore';

beforeEach(() => {
  applyLanguage('en');
  useAuthStore.setState({ currentUserId: null });
});

describe('RegisterPage', () => {
  it('flags mismatched passwords', async () => {
    renderWithRouter(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Display name'), 'Tester');
    await userEvent.type(screen.getByLabelText('Email'), 'tester@trimir.app');
    await userEvent.type(screen.getByLabelText('Password'), 'secret1');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'secret2');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('opens the privacy policy modal from the inline link', async () => {
    renderWithRouter(<RegisterPage />);
    await userEvent.click(screen.getByRole('button', { name: 'privacy policy' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
