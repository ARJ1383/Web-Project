import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaylistStore } from './playlistStore';

beforeEach(() => {
  usePlaylistStore.setState({ playlists: [] });
});

describe('playlistStore', () => {
  it('creates a playlist for the owner', () => {
    const created = usePlaylistStore.getState().create('u1', 'basic', 'Road Trip');
    expect(created).not.toBeNull();
    expect(usePlaylistStore.getState().getByOwner('u1')).toHaveLength(1);
    expect(created?.name).toBe('Road Trip');
  });

  it('enforces the basic-tier playlist limit (6)', () => {
    for (let i = 0; i < 6; i++) usePlaylistStore.getState().create('u1', 'basic', `P${i}`);
    const seventh = usePlaylistStore.getState().create('u1', 'basic', 'P7');
    expect(seventh).toBeNull();
    expect(usePlaylistStore.getState().getByOwner('u1')).toHaveLength(6);
  });

  it('does not limit gold-tier users', () => {
    for (let i = 0; i < 50; i++) usePlaylistStore.getState().create('g1', 'gold', `P${i}`);
    expect(usePlaylistStore.getState().getByOwner('g1')).toHaveLength(50);
  });

  it('renames a playlist', () => {
    const p = usePlaylistStore.getState().create('u1', 'gold', 'Old')!;
    usePlaylistStore.getState().rename(p.id, 'New');
    expect(usePlaylistStore.getState().getById(p.id)?.name).toBe('New');
  });

  it('deletes a playlist', () => {
    const p = usePlaylistStore.getState().create('u1', 'gold', 'Temp')!;
    usePlaylistStore.getState().remove(p.id);
    expect(usePlaylistStore.getState().getById(p.id)).toBeUndefined();
  });

  it('adds and removes songs without duplicates', () => {
    const p = usePlaylistStore.getState().create('u1', 'gold', 'Mix')!;
    usePlaylistStore.getState().addSong(p.id, 's1');
    usePlaylistStore.getState().addSong(p.id, 's1');
    expect(usePlaylistStore.getState().getById(p.id)?.songIds).toEqual(['s1']);
    usePlaylistStore.getState().removeSong(p.id, 's1');
    expect(usePlaylistStore.getState().getById(p.id)?.songIds).toEqual([]);
  });
});
