/**
 * Core domain models for Trimir.
 *
 * Phase 1 is a frontend mock; these types are the contract that the Phase 2
 * Django backend will mirror. Keep them framework-agnostic and serializable.
 */

export type Role = 'listener' | 'artist' | 'support' | 'admin';

export type SubscriptionTier = 'basic' | 'silver' | 'gold';

export type Gender = 'male' | 'female' | 'other' | 'unspecified';

/** Verification state for an artist account. */
export type ArtistStatus = 'pending' | 'approved' | 'rejected';

export type ReleaseType = 'single' | 'album';

export interface Subscription {
  tier: SubscriptionTier;
  /** ISO date string; null for the free/basic plan. */
  expiresAt: string | null;
}

export interface UserSettings {
  /** Max number of in-app notifications to keep/show. */
  notificationLimit: number;
  /** System volume 0–100. */
  volume: number;
  language: 'fa' | 'en';
}

export interface User {
  id: string;
  role: Role;
  email: string;
  /** Mocked password — never do this in a real backend (Phase 2 will hash server-side). */
  password: string;
  /** System-assigned handle, e.g. `@trimir_8f3a`. Distinct from displayName. */
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string;
  birthDate?: string;
  gender?: Gender;
  subscription: Subscription;
  settings: UserSettings;
  followerIds: string[];
  followingIds: string[];
  /** Aggregate stat shown on the profile (mocked). */
  dailyStreamCount: number;
  createdAt: string;
}

export interface Artist extends User {
  role: 'artist';
  artistName: string;
  status: ArtistStatus;
  /** Reason shown to the artist when rejected (or note when approved). */
  statusReason?: string;
  verified: boolean;
  portfolioUrl?: string;
  totalListeners: number;
  totalStreams: number;
  albumIds: string[];
  songIds: string[];
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string | null;
  albumTitle?: string;
  coverUrl: string;
  /** Duration in seconds. */
  duration: number;
  genre?: string;
  releaseYear?: number;
  lyrics?: string;
  listeners: number;
  streams: number;
  createdAt: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseType: ReleaseType;
  releaseYear?: number;
  genre?: string;
  songIds: string[];
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  ownerId: string;
  coverUrl: string | null;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'subscription_expiry'
  | 'new_release'
  | 'verification_result'
  | 'monthly_payout'
  | 'new_ticket'
  | 'new_verification_request';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  /** Optional in-app route to navigate to when the notification is clicked. */
  link?: string;
}

/** Shape of the persisted mock database (Local Storage). */
export interface MockDatabase {
  users: User[];
  artists: Artist[];
  songs: Song[];
  albums: Album[];
  notifications: AppNotification[];
}
