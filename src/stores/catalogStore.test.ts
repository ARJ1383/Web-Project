import { describe, it, expect, beforeEach } from 'vitest';
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
});

describe('catalogStore', () => {
  it('toggles follow on both sides of the relationship', () => {
    const store = useCatalogStore.getState();
    // user_nina does not follow aurora initially
    expect(store.getUserById('user_nina')?.followingIds).not.toContain('artist_aurora');

    store.toggleFollow('user_nina', 'artist_aurora');
    expect(useCatalogStore.getState().getUserById('user_nina')?.followingIds).toContain(
      'artist_aurora',
    );
    expect(useCatalogStore.getState().getArtistById('artist_aurora')?.followerIds).toContain(
      'user_nina',
    );

    // toggling again removes it
    useCatalogStore.getState().toggleFollow('user_nina', 'artist_aurora');
    expect(useCatalogStore.getState().getUserById('user_nina')?.followingIds).not.toContain(
      'artist_aurora',
    );
  });

  it('sorts popular songs by stream count', () => {
    const top = useCatalogStore.getState().popularSongs(3);
    expect(top).toHaveLength(3);
    expect(top[0].streams).toBeGreaterThanOrEqual(top[1].streams);
  });

  it('finds users by email case-insensitively', () => {
    expect(useCatalogStore.getState().findByEmail('SARA@trimir.app')?.id).toBe('user_sara');
  });
});
