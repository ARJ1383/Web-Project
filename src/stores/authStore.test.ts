import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { getTokens, setTokens } from '@/lib/api';
import { apiUser, mockApi, signIn } from '@/test/api-mock';

const tokens = { access: 'a', refresh: 'r' };

beforeEach(() => {
  vi.unstubAllGlobals();
  setTokens(null);
  useAuthStore.setState({ currentUser: null, ready: false });
});

describe('authStore', () => {
  it('logs in, stores the tokens and caches the account', async () => {
    mockApi({ 'POST /auth/login/': { body: { user: apiUser, tokens } } });
    const result = await useAuthStore.getState().login('sara@trimir.app', 'password123');
    expect(result.ok).toBe(true);
    expect(getTokens()).toEqual(tokens);
    expect(useAuthStore.getState().currentUser?.displayName).toBe('Sara');
  });

  it('surfaces the API message for invalid credentials', async () => {
    mockApi({ 'POST /auth/login/': { status: 400, body: { detail: 'Invalid credentials.' } } });
    const result = await useAuthStore.getState().login('sara@trimir.app', 'nope');
    expect(result).toEqual({ ok: false, error: 'Invalid credentials.' });
    expect(getTokens()).toBeNull();
  });

  it('registers a listener and signs them in', async () => {
    const { calls } = mockApi({
      'POST /auth/register/': {
        status: 201,
        body: { user: { ...apiUser, subscription_tier: 'basic' }, tokens },
      },
    });
    const result = await useAuthStore.getState().register({
      displayName: 'Tester',
      email: 'tester@trimir.app',
      password: 'Trimir-2026-pass',
      confirmPassword: 'Trimir-2026-pass',
    });
    expect(result.ok).toBe(true);
    expect(calls[0].body).toMatchObject({ confirm_password: 'Trimir-2026-pass' });
    if (result.ok) expect(result.user.subscription.tier).toBe('basic');
  });

  it('registers an artist as pending', async () => {
    mockApi({
      'POST /auth/artist-register/': {
        status: 201,
        body: {
          user: {
            ...apiUser,
            role: 'artist',
            artist_profile: {
              artist_name: 'New Artist',
              status: 'pending',
              verified: false,
              total_listeners: 0,
              total_streams: 0,
            },
          },
          tokens,
        },
      },
    });
    const result = await useAuthStore.getState().registerArtist({
      artistName: 'New Artist',
      email: 'artist@trimir.app',
      password: 'Trimir-2026-pass',
      confirmPassword: 'Trimir-2026-pass',
    });
    expect(result.ok).toBe(true);
    if (result.ok && 'status' in result.user) {
      expect(result.user.status).toBe('pending');
      expect(result.user.verified).toBe(false);
    }
  });

  it('restores a stored session from /auth/me/', async () => {
    signIn();
    mockApi({ 'GET /auth/me/': { body: apiUser } });
    await useAuthStore.getState().restore();
    expect(useAuthStore.getState().ready).toBe(true);
    expect(useAuthStore.getState().currentUser?.id).toBe('1');
  });

  it('clears a session the backend no longer accepts', async () => {
    signIn();
    mockApi({ 'GET /auth/me/': { status: 401, body: {} } });
    await useAuthStore.getState().restore();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(getTokens()).toBeNull();
  });

  it('logs out, blacklisting the refresh token', async () => {
    signIn();
    useAuthStore.setState({ currentUser: { id: '1' } as never });
    const { calls } = mockApi({ 'POST /auth/logout/': { status: 204 } });
    await useAuthStore.getState().logout();
    expect(calls[0].body).toEqual({ refresh: 'refresh-token' });
    expect(getTokens()).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('deletes the account and drops the session', async () => {
    signIn();
    useAuthStore.setState({ currentUser: { id: '1' } as never });
    mockApi({ 'DELETE /auth/me/': { status: 204 } });
    await useAuthStore.getState().deleteAccount();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(getTokens()).toBeNull();
  });
});
