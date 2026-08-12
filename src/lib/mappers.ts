/**
 * Translation layer between the Django payloads (snake_case, numeric ids) and
 * the domain models the UI already speaks.
 */
import type {
  AdminOverview,
  Album,
  AppNotification,
  Artist,
  ArtistReport,
  AuditRecord,
  Playlist,
  Role,
  Song,
  SubscriptionTier,
  SupportTicket,
  User,
} from '@/types/models';

export interface ApiUser {
  id: number;
  email: string;
  username: string;
  display_name: string;
  role: Role;
  avatar: string | null;
  bio?: string;
  birth_date?: string | null;
  gender?: User['gender'];
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  notification_limit: number;
  volume: number;
  language: 'fa' | 'en';
  theme: 'dark' | 'light';
  daily_stream_count: number;
  last_stream_date?: string | null;
  follower_ids: number[];
  following_ids: number[];
  artist_profile: {
    artist_name: string;
    status: Artist['status'];
    status_reason?: string;
    verified: boolean;
    portfolio_url?: string;
    total_listeners: number;
    total_streams: number;
  } | null;
  created_at: string;
}

export interface ApiSong {
  id: number;
  title: string;
  artist_id: number;
  artist_display_name: string;
  album_id: number | null;
  album_title: string | null;
  cover: string | null;
  audio_file: string | null;
  duration_seconds: number;
  genre?: string;
  release_year?: number | null;
  lyrics?: string;
  collaborators?: string[];
  listeners_count: number;
  streams_count: number;
  revenue: string;
  is_released: boolean;
  created_at: string;
}

export interface ApiAlbum {
  id: number;
  title: string;
  artist_id: number;
  artist_display_name: string;
  cover: string | null;
  release_type: Album['releaseType'];
  release_year?: number | null;
  genre?: string;
  song_ids: number[];
  created_at: string;
}

export interface ApiPlaylist {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  owner_id: number;
  cover: string | null;
  song_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface ApiNotification {
  id: number;
  type: AppNotification['type'];
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface ApiTicket {
  id: number;
  user_id: number;
  user_name: string;
  subject: string;
  status: SupportTicket['status'];
  messages: {
    id: number;
    sender_role: 'user' | 'support';
    sender_name: string;
    body: string;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface ApiPayout {
  id: number;
  artist_id: number;
  artist_name: string;
  month: string;
  unique_listeners: number;
  monthly_streams: number;
  reward_amount: string;
  status: AuditRecord['status'];
  settled_at: string | null;
}

/** Covers are optional server-side; keep a stable stand-in so cards never break. */
function coverUrl(cover: string | null, seed: string | number): string {
  return cover ?? `https://picsum.photos/seed/trimir-${seed}/400/400`;
}

export function toUser(data: ApiUser): User | Artist {
  const base: User = {
    id: String(data.id),
    role: data.role,
    email: data.email,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar,
    bio: data.bio || undefined,
    birthDate: data.birth_date ?? undefined,
    gender: data.gender,
    subscription: { tier: data.subscription_tier, expiresAt: data.subscription_expires_at },
    settings: {
      notificationLimit: data.notification_limit,
      volume: data.volume,
      language: data.language,
      theme: data.theme,
    },
    followerIds: data.follower_ids.map(String),
    followingIds: data.following_ids.map(String),
    dailyStreamCount: data.daily_stream_count,
    lastStreamDate: data.last_stream_date ?? undefined,
    createdAt: data.created_at,
  };

  const profile = data.artist_profile;
  if (data.role !== 'artist' || !profile) return base;

  return {
    ...base,
    role: 'artist',
    artistName: profile.artist_name,
    status: profile.status,
    statusReason: profile.status_reason || undefined,
    verified: profile.verified,
    portfolioUrl: profile.portfolio_url || undefined,
    totalListeners: profile.total_listeners,
    totalStreams: profile.total_streams,
  } satisfies Artist;
}

export function toSong(data: ApiSong): Song {
  return {
    id: String(data.id),
    title: data.title,
    artistId: String(data.artist_id),
    artistName: data.artist_display_name,
    albumId: data.album_id === null ? null : String(data.album_id),
    albumTitle: data.album_title ?? undefined,
    coverUrl: coverUrl(data.cover, `song-${data.id}`),
    duration: data.duration_seconds,
    genre: data.genre || undefined,
    releaseYear: data.release_year ?? undefined,
    lyrics: data.lyrics || undefined,
    listeners: data.listeners_count,
    streams: data.streams_count,
    revenue: Number(data.revenue ?? 0),
    audioFile: data.audio_file ?? undefined,
    collaborators: data.collaborators ?? [],
    isReleased: data.is_released,
    createdAt: data.created_at,
  };
}

export function toAlbum(data: ApiAlbum): Album {
  return {
    id: String(data.id),
    title: data.title,
    artistId: String(data.artist_id),
    artistName: data.artist_display_name,
    coverUrl: coverUrl(data.cover, `album-${data.id}`),
    releaseType: data.release_type,
    releaseYear: data.release_year ?? undefined,
    genre: data.genre || undefined,
    songIds: data.song_ids.map(String),
    createdAt: data.created_at,
  };
}

export function toPlaylist(data: ApiPlaylist): Playlist {
  return {
    id: String(data.id),
    name: data.name,
    description: data.description || undefined,
    isPublic: data.is_public,
    ownerId: String(data.owner_id),
    coverUrl: data.cover,
    songIds: data.song_ids.map(String),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function toNotification(data: ApiNotification, userId: string): AppNotification {
  return {
    id: String(data.id),
    userId,
    type: data.type,
    title: data.title,
    body: data.body,
    read: data.read,
    createdAt: data.created_at,
    link: data.link || undefined,
  };
}

export function toTicket(data: ApiTicket): SupportTicket {
  return {
    id: String(data.id),
    userId: String(data.user_id),
    userName: data.user_name,
    subject: data.subject,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    messages: data.messages.map((message) => ({
      id: String(message.id),
      senderRole: message.sender_role,
      senderName: message.sender_name,
      body: message.body,
      createdAt: message.created_at,
    })),
  };
}

export interface ApiOverview {
  tier_counts: Record<SubscriptionTier, number>;
  total_accounts: number;
  monthly_revenue: number;
  collected_this_month: number;
  currency: string;
  pending_artists: number;
  open_tickets: number;
  pending_payout: number;
}

export interface ApiArtistReport {
  month: string;
  song_count: number;
  album_count: number;
  follower_count: number;
  total_streams: number;
  total_listeners: number;
  total_revenue: number;
  unique_listeners: number;
  monthly_streams: number;
  monthly_unique_listeners: number;
  top_songs: {
    id: number;
    title: string;
    streams_count: number;
    listeners_count: number;
    revenue: number;
  }[];
}

export function toOverview(data: ApiOverview): AdminOverview {
  return {
    tierCounts: data.tier_counts,
    totalAccounts: data.total_accounts,
    monthlyRevenue: Number(data.monthly_revenue),
    collectedThisMonth: Number(data.collected_this_month),
    currency: data.currency,
    pendingArtists: data.pending_artists,
    openTickets: data.open_tickets,
    pendingPayout: Number(data.pending_payout),
  };
}

export function toArtistReport(data: ApiArtistReport): ArtistReport {
  return {
    month: data.month,
    songCount: data.song_count,
    albumCount: data.album_count,
    followerCount: data.follower_count,
    totalStreams: data.total_streams,
    totalListeners: data.total_listeners,
    totalRevenue: Number(data.total_revenue),
    uniqueListeners: data.unique_listeners,
    monthlyStreams: data.monthly_streams,
    monthlyUniqueListeners: data.monthly_unique_listeners,
    topSongs: data.top_songs.map((song) => ({
      id: String(song.id),
      title: song.title,
      streams: song.streams_count,
      listeners: song.listeners_count,
      revenue: Number(song.revenue),
    })),
  };
}

export function toAuditRecord(data: ApiPayout): AuditRecord {
  return {
    id: String(data.id),
    artistId: String(data.artist_id),
    artistName: data.artist_name,
    uniqueListeners: data.unique_listeners,
    monthlyStreams: data.monthly_streams,
    rewardAmount: Number(data.reward_amount),
    status: data.status,
    monthLabel: data.month,
    settledAt: data.settled_at,
  };
}
