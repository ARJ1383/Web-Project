import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from './playerStore';

const reset = () =>
  usePlayerStore.setState({
    queue: [],
    currentSongId: null,
    playing: false,
    currentTime: 0,
    duration: 0,
    shuffle: false,
    repeat: 'off',
    pendingSeek: null,
  });

beforeEach(reset);

describe('playerStore', () => {
  it('playSong sets the queue and starts playback from zero', () => {
    usePlayerStore.getState().playSong('b', ['a', 'b', 'c']);
    const s = usePlayerStore.getState();
    expect(s.currentSongId).toBe('b');
    expect(s.queue).toEqual(['a', 'b', 'c']);
    expect(s.playing).toBe(true);
    expect(s.currentTime).toBe(0);
  });

  it('next advances through the queue and stops at the end without repeat', () => {
    usePlayerStore.getState().playSong('b', ['a', 'b', 'c']);
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentSongId).toBe('c');
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentSongId).toBe('c');
    expect(usePlayerStore.getState().playing).toBe(false);
  });

  it('repeat "all" wraps from the last song back to the first', () => {
    usePlayerStore.getState().playSong('c', ['a', 'b', 'c']);
    usePlayerStore.setState({ repeat: 'all' });
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentSongId).toBe('a');
  });

  it('repeat "one" restarts the same song', () => {
    usePlayerStore.getState().playSong('b', ['a', 'b', 'c']);
    usePlayerStore.setState({ repeat: 'one', currentTime: 10 });
    usePlayerStore.getState().next();
    const s = usePlayerStore.getState();
    expect(s.currentSongId).toBe('b');
    expect(s.pendingSeek?.time).toBe(0);
  });

  it('shuffle picks a different song from the queue', () => {
    usePlayerStore.getState().playSong('a', ['a', 'b']);
    usePlayerStore.setState({ shuffle: true });
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentSongId).toBe('b');
  });

  it('previous restarts the track mid-song and steps back near the start', () => {
    usePlayerStore.getState().playSong('b', ['a', 'b']);
    usePlayerStore.setState({ currentTime: 20 });
    usePlayerStore.getState().previous();
    expect(usePlayerStore.getState().currentSongId).toBe('b');
    expect(usePlayerStore.getState().pendingSeek?.time).toBe(0);

    usePlayerStore.setState({ currentTime: 1, pendingSeek: null });
    usePlayerStore.getState().previous();
    expect(usePlayerStore.getState().currentSongId).toBe('a');
  });

  it('requestSeek stores a pending seek until the controller consumes it', () => {
    usePlayerStore.getState().requestSeek(42);
    expect(usePlayerStore.getState().currentTime).toBe(42);
    expect(usePlayerStore.getState().pendingSeek?.time).toBe(42);
    usePlayerStore.getState().consumeSeek();
    expect(usePlayerStore.getState().pendingSeek).toBeNull();
  });

  it('addToQueue ignores duplicates', () => {
    usePlayerStore.getState().addToQueue('a');
    usePlayerStore.getState().addToQueue('a');
    expect(usePlayerStore.getState().queue).toEqual(['a']);
  });
});
