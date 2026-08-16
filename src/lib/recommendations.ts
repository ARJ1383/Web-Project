/**
 * Recommendation API contracts.
 * The ranking itself is intentionally implemented on the Django backend so
 * it can use the user's persisted PlayEvent history rather than browser state.
 */
import type { Song } from '@/types/models';

export interface Recommendation {
  song: Song;
  score: number;
  reason: string;
}
