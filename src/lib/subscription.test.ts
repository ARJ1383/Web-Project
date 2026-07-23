import { describe, it, expect } from 'vitest';
import { TIER_CAPABILITIES, canCreatePlaylist, formatLimit, getCapabilities } from './subscription';

describe('subscription tier rules (PDF جدول ۱)', () => {
  it('encodes the playlist limits per tier', () => {
    expect(TIER_CAPABILITIES.basic.maxPlaylists).toBe(6);
    expect(TIER_CAPABILITIES.silver.maxPlaylists).toBe(100);
    expect(TIER_CAPABILITIES.gold.maxPlaylists).toBe(Infinity);
  });

  it('encodes the daily stream limits per tier', () => {
    expect(TIER_CAPABILITIES.basic.dailyStreamLimit).toBe(60);
    expect(TIER_CAPABILITIES.silver.dailyStreamLimit).toBe(Infinity);
    expect(TIER_CAPABILITIES.gold.dailyStreamLimit).toBe(Infinity);
  });

  it('gates avatar upload to silver and gold', () => {
    expect(getCapabilities('basic').canUploadAvatar).toBe(false);
    expect(getCapabilities('silver').canUploadAvatar).toBe(true);
    expect(getCapabilities('gold').canUploadAvatar).toBe(true);
  });

  it('gates downloads to silver and gold (PDF جدول ۱)', () => {
    expect(getCapabilities('basic').canDownload).toBe(false);
    expect(getCapabilities('silver').canDownload).toBe(true);
    expect(getCapabilities('gold').canDownload).toBe(true);
  });

  it('gates early access and stats to gold only', () => {
    for (const cap of ['earlyAccess', 'canSeeStats'] as const) {
      expect(getCapabilities('basic')[cap]).toBe(false);
      expect(getCapabilities('silver')[cap]).toBe(false);
      expect(getCapabilities('gold')[cap]).toBe(true);
    }
  });

  describe('canCreatePlaylist', () => {
    it('blocks a basic user at the 6-playlist limit', () => {
      expect(canCreatePlaylist('basic', 5)).toBe(true);
      expect(canCreatePlaylist('basic', 6)).toBe(false);
    });
    it('never blocks a gold user', () => {
      expect(canCreatePlaylist('gold', 9999)).toBe(true);
    });
  });

  it('formats unlimited as ∞', () => {
    expect(formatLimit(6)).toBe('6');
    expect(formatLimit(Infinity)).toBe('∞');
  });
});
