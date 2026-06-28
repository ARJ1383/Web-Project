import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useCatalogStore } from './catalogStore';
import { buildSeedDatabase } from '@/lib/seed';

beforeEach(() => {
  const seed = buildSeedDatabase();
  useCatalogStore.setState({
    users: seed.users,
    artists: seed.artists,
    songs: seed.songs,
    albums: seed.albums,
  });
  useAuthStore.setState({ currentUserId: null });
});

describe('authStore', () => {
  it('logs in with valid seeded credentials', () => {
    const result = useAuthStore.getState().login('sara@trimir.app', 'password123');
    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().currentUserId).toBe('user_sara');
  });

  it('rejects an invalid password', () => {
    const result = useAuthStore.getState().login('sara@trimir.app', 'wrong');
    expect(result).toEqual({ ok: false, error: 'auth.invalidCredentials' });
    expect(useAuthStore.getState().currentUserId).toBeNull();
  });

  it('registers a new listener and signs them in', () => {
    const result = useAuthStore.getState().register({
      displayName: 'Test User',
      email: 'new@trimir.app',
      password: 'secret1',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.role).toBe('listener');
      expect(result.user.subscription.tier).toBe('basic');
      expect(useAuthStore.getState().currentUserId).toBe(result.user.id);
    }
  });

  it('refuses to register a duplicate email', () => {
    const result = useAuthStore.getState().register({
      displayName: 'Dupe',
      email: 'sara@trimir.app',
      password: 'secret1',
    });
    expect(result).toEqual({ ok: false, error: 'auth.emailTaken' });
  });

  it('registers an artist in pending status', () => {
    const result = useAuthStore.getState().registerArtist({
      artistName: 'New Artist',
      email: 'newartist@trimir.app',
      password: 'secret1',
    });
    expect(result.ok).toBe(true);
    if (result.ok && 'status' in result.user) {
      expect(result.user.status).toBe('pending');
      expect(result.user.verified).toBe(false);
    }
  });

  it('deletes the current account and logs out', () => {
    useAuthStore.getState().login('ali@trimir.app', 'password123');
    useAuthStore.getState().deleteAccount();
    expect(useAuthStore.getState().currentUserId).toBeNull();
    expect(useCatalogStore.getState().getUserById('user_ali')).toBeUndefined();
  });
});
