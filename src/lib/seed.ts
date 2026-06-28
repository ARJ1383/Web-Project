/**
 * Deterministic seed data for the Phase 1 mock.
 *
 * Covers the four roles (listener / artist / support / admin), several artists
 * (some verified, one pending), albums, singles and role-specific notifications,
 * so every screen has realistic content and the four demo logins below work.
 *
 * Demo credentials (password is the same for all): `password123`
 *   listener (gold)   → sara@trimir.app
 *   listener (basic)  → ali@trimir.app
 *   listener (silver) → nina@trimir.app
 *   artist (approved) → aurora@trimir.app
 *   artist (pending)  → mehr@trimir.app
 *   support           → support@trimir.app
 *   admin             → admin@trimir.app
 */
import type {
  Album,
  Artist,
  AppNotification,
  MockDatabase,
  Playlist,
  Song,
  User,
} from '@/types/models';

const PASSWORD = 'password123';
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;
const NOW = '2026-06-01T10:00:00.000Z';

function baseUser(
  partial: Partial<User> & Pick<User, 'id' | 'email' | 'username' | 'displayName' | 'role'>,
): User {
  return {
    password: PASSWORD,
    avatarUrl: null,
    subscription: { tier: 'basic', expiresAt: null },
    settings: { notificationLimit: 50, volume: 70, language: 'fa' },
    followerIds: [],
    followingIds: [],
    dailyStreamCount: 0,
    createdAt: NOW,
    ...partial,
  };
}

// --- Listeners / staff -------------------------------------------------------
const listeners: User[] = [
  baseUser({
    id: 'user_sara',
    email: 'sara@trimir.app',
    username: '@sara_9f2c',
    displayName: 'سارا محمدی',
    role: 'listener',
    bio: 'دوستدار موسیقی الکترونیک.',
    subscription: { tier: 'gold', expiresAt: '2026-09-01T00:00:00.000Z' },
    avatarUrl: 'https://i.pravatar.cc/200?img=5',
    followingIds: ['artist_aurora', 'artist_neon'],
    dailyStreamCount: 23,
  }),
  baseUser({
    id: 'user_ali',
    email: 'ali@trimir.app',
    username: '@ali_3b71',
    displayName: 'علی رضایی',
    role: 'listener',
    subscription: { tier: 'basic', expiresAt: null },
    followingIds: ['artist_aurora'],
    dailyStreamCount: 41,
  }),
  baseUser({
    id: 'user_nina',
    email: 'nina@trimir.app',
    username: '@nina_7d44',
    displayName: 'نینا کریمی',
    role: 'listener',
    subscription: { tier: 'silver', expiresAt: '2026-07-15T00:00:00.000Z' },
    avatarUrl: 'https://i.pravatar.cc/200?img=9',
    followingIds: ['artist_lowfi'],
    dailyStreamCount: 12,
  }),
  baseUser({
    id: 'support_reza',
    email: 'support@trimir.app',
    username: '@support_rz',
    displayName: 'رضا (پشتیبانی)',
    role: 'support',
  }),
  baseUser({
    id: 'admin_root',
    email: 'admin@trimir.app',
    username: '@admin',
    displayName: 'مدیر سامانه',
    role: 'admin',
    subscription: { tier: 'gold', expiresAt: null },
  }),
];

// --- Artists -----------------------------------------------------------------
function buildArtist(
  partial: Partial<Artist> &
    Pick<Artist, 'id' | 'email' | 'username' | 'displayName' | 'artistName' | 'status'>,
): Artist {
  return {
    ...baseUser({ ...partial, role: 'artist' }),
    role: 'artist',
    verified: partial.status === 'approved',
    totalListeners: 0,
    totalStreams: 0,
    albumIds: [],
    songIds: [],
    ...partial,
  };
}

const artists: Artist[] = [
  buildArtist({
    id: 'artist_aurora',
    email: 'aurora@trimir.app',
    username: '@aurora',
    displayName: 'Aurora Skye',
    artistName: 'Aurora Skye',
    status: 'approved',
    bio: 'Dream-pop and ambient soundscapes.',
    avatarUrl: 'https://i.pravatar.cc/200?img=32',
    subscription: { tier: 'gold', expiresAt: '2027-01-01T00:00:00.000Z' },
    totalListeners: 18420,
    totalStreams: 245300,
    followerIds: ['user_sara', 'user_ali'],
    albumIds: ['album_aurora_nightfall'],
    songIds: ['song_horizon', 'song_aurora_lights', 'song_still_water'],
  }),
  buildArtist({
    id: 'artist_neon',
    email: 'neon@trimir.app',
    username: '@neonpulse',
    displayName: 'Neon Pulse',
    artistName: 'Neon Pulse',
    status: 'approved',
    bio: 'Synthwave and retro electronica.',
    avatarUrl: 'https://i.pravatar.cc/200?img=12',
    subscription: { tier: 'silver', expiresAt: '2026-08-01T00:00:00.000Z' },
    totalListeners: 9100,
    totalStreams: 132000,
    followerIds: ['user_sara'],
    albumIds: ['album_neon_drive'],
    songIds: ['song_midnight_drive', 'song_chrome'],
  }),
  buildArtist({
    id: 'artist_lowfi',
    email: 'lofi@trimir.app',
    username: '@lofilab',
    displayName: 'Lo-Fi Lab',
    artistName: 'Lo-Fi Lab',
    status: 'approved',
    bio: 'Beats to study and relax to.',
    totalListeners: 30200,
    totalStreams: 510000,
    followerIds: ['user_nina'],
    songIds: ['song_rainy_window'],
  }),
  buildArtist({
    id: 'artist_mehr',
    email: 'mehr@trimir.app',
    username: '@mehr',
    displayName: 'مهر',
    artistName: 'مهر',
    status: 'pending',
    statusReason: undefined,
    bio: 'هنرمند تازه‌وارد، در انتظار تایید.',
    portfolioUrl: 'https://example.com/mehr-demo',
  }),
];

// --- Albums & songs ----------------------------------------------------------
const albums: Album[] = [
  {
    id: 'album_aurora_nightfall',
    title: 'Nightfall',
    artistId: 'artist_aurora',
    artistName: 'Aurora Skye',
    coverUrl: cover('nightfall'),
    releaseType: 'album',
    releaseYear: 2025,
    genre: 'Dream Pop',
    songIds: ['song_horizon', 'song_aurora_lights', 'song_still_water'],
    createdAt: '2025-11-02T00:00:00.000Z',
  },
  {
    id: 'album_neon_drive',
    title: 'Drive',
    artistId: 'artist_neon',
    artistName: 'Neon Pulse',
    coverUrl: cover('neondrive'),
    releaseType: 'album',
    releaseYear: 2024,
    genre: 'Synthwave',
    songIds: ['song_midnight_drive', 'song_chrome'],
    createdAt: '2024-09-12T00:00:00.000Z',
  },
];

const songs: Song[] = [
  song(
    'song_horizon',
    'Horizon',
    'artist_aurora',
    'Aurora Skye',
    'album_aurora_nightfall',
    'Nightfall',
    'horizon',
    214,
    18420,
    96000,
  ),
  song(
    'song_aurora_lights',
    'Aurora Lights',
    'artist_aurora',
    'Aurora Skye',
    'album_aurora_nightfall',
    'Nightfall',
    'lights',
    198,
    15300,
    81000,
  ),
  song(
    'song_still_water',
    'Still Water',
    'artist_aurora',
    'Aurora Skye',
    'album_aurora_nightfall',
    'Nightfall',
    'stillwater',
    245,
    9900,
    52000,
  ),
  song(
    'song_midnight_drive',
    'Midnight Drive',
    'artist_neon',
    'Neon Pulse',
    'album_neon_drive',
    'Drive',
    'midnight',
    230,
    9100,
    70000,
  ),
  song(
    'song_chrome',
    'Chrome',
    'artist_neon',
    'Neon Pulse',
    'album_neon_drive',
    'Drive',
    'chrome',
    201,
    7600,
    62000,
  ),
  song(
    'song_rainy_window',
    'Rainy Window',
    'artist_lowfi',
    'Lo-Fi Lab',
    null,
    undefined,
    'rainy',
    178,
    30200,
    145000,
  ),
];

function song(
  id: string,
  title: string,
  artistId: string,
  artistName: string,
  albumId: string | null,
  albumTitle: string | undefined,
  coverSeed: string,
  duration: number,
  listeners: number,
  streams: number,
): Song {
  return {
    id,
    title,
    artistId,
    artistName,
    albumId,
    albumTitle,
    coverUrl: cover(coverSeed),
    duration,
    listeners,
    streams,
    createdAt: NOW,
  };
}

// --- Notifications (role-specific) ------------------------------------------
const notifications: AppNotification[] = [
  {
    id: 'ntf_1',
    userId: 'user_sara',
    type: 'new_release',
    title: 'انتشار اثر جدید',
    body: 'Aurora Skye آهنگ تازه‌ای منتشر کرد: «Horizon».',
    read: false,
    createdAt: '2026-05-30T09:00:00.000Z',
    link: '/artist/artist_aurora',
  },
  {
    id: 'ntf_2',
    userId: 'user_nina',
    type: 'subscription_expiry',
    title: 'پایان اشتراک نزدیک است',
    body: 'اشتراک نقره‌ای شما تا ۱۰ روز دیگر منقضی می‌شود.',
    read: false,
    createdAt: '2026-05-29T12:00:00.000Z',
    link: '/settings',
  },
  {
    id: 'ntf_3',
    userId: 'user_ali',
    type: 'subscription_expiry',
    title: 'ارتقای اشتراک',
    body: 'با ارتقا به نقره‌ای می‌توانید عکس پروفایل اضافه کنید.',
    read: true,
    createdAt: '2026-05-20T12:00:00.000Z',
    link: '/settings',
  },
  {
    id: 'ntf_4',
    userId: 'artist_aurora',
    type: 'verification_result',
    title: 'حساب شما تایید شد',
    body: 'تبریک! حساب هنری شما توسط تیم پشتیبانی تایید شد.',
    read: true,
    createdAt: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'ntf_5',
    userId: 'artist_aurora',
    type: 'monthly_payout',
    title: 'محاسبات مالی ماهانه',
    body: 'پاداش ماه گذشته شما محاسبه و ثبت شد.',
    read: false,
    createdAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'ntf_6',
    userId: 'support_reza',
    type: 'new_verification_request',
    title: 'درخواست احراز هویت جدید',
    body: 'هنرمند «مهر» درخواست تایید ثبت کرد.',
    read: false,
    createdAt: '2026-06-02T07:30:00.000Z',
    link: '/dashboard',
  },
  {
    id: 'ntf_7',
    userId: 'support_reza',
    type: 'new_ticket',
    title: 'تیکت پشتیبانی جدید',
    body: 'کاربر «علی رضایی» تیکت تازه‌ای باز کرد.',
    read: false,
    createdAt: '2026-06-02T09:10:00.000Z',
    link: '/dashboard',
  },
];

export function buildSeedDatabase(): MockDatabase {
  return {
    users: listeners,
    artists,
    songs,
    albums,
    notifications,
  };
}

/** A couple of starter playlists so the Playlists screen isn't empty for the demo user. */
export function buildSeedPlaylists(): Playlist[] {
  return [
    {
      id: 'pl_chill',
      name: 'Chill Evenings',
      ownerId: 'user_sara',
      coverUrl: cover('chill'),
      songIds: ['song_still_water', 'song_rainy_window'],
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-25T00:00:00.000Z',
    },
    {
      id: 'pl_drive',
      name: 'Night Drive',
      ownerId: 'user_sara',
      coverUrl: cover('drivelist'),
      songIds: ['song_midnight_drive', 'song_chrome', 'song_horizon'],
      createdAt: '2026-05-12T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    },
  ];
}
