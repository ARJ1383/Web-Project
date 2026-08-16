import { describe, expect, it } from 'vitest';
import type { Recommendation } from './recommendations';

describe('Recommendation API contract', () => {
  it('keeps a non-random score and explanation with every recommendation', () => {
    const item: Recommendation = {
      song: {
        id: '1',
        title: 'Rock A',
        artistId: 'artist-rock',
        artistName: 'Rock Artist',
        albumId: null,
        coverUrl: '',
        duration: 180,
        genre: 'rock',
        listeners: 100,
        streams: 200,
        createdAt: '2026-08-01',
      },
      score: 1.234,
      reason: 'مشابه آهنگ‌هایی که اخیراً گوش داده‌اید: «Rock B»',
    };

    expect(item.score).toBeGreaterThan(0);
    expect(item.reason).toContain('مشابه');
  });
});
