import { describe, it, expect } from 'vitest';
import { formatDuration, generateUsername, uid } from './format';

describe('format helpers', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(214)).toBe('3:34');
  });

  it('generates a handle that starts with @ and is slugified', () => {
    const handle = generateUsername('Sara Mohammadi');
    expect(handle.startsWith('@sara_mohammadi_')).toBe(true);
    expect(handle).not.toMatch(/\s/);
  });

  it('falls back to "user" for non-latin display names', () => {
    expect(generateUsername('سارا').startsWith('@user_')).toBe(true);
  });

  it('produces unique-ish ids with a prefix', () => {
    expect(uid('pl')).not.toBe(uid('pl'));
    expect(uid('pl').startsWith('pl_')).toBe(true);
  });
});
