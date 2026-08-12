# Backend Requirements (for Phase 2)

Per the project brief (note #12), while building the Phase-1 frontend we recorded the
backend needs it implies. This is the design note that shaped the API; the endpoints and
models as built live in [`backend/README.md`](../backend/README.md), and the payload
shapes are mapped to [`src/types/models.ts`](../src/types/models.ts) by
[`src/lib/mappers.ts`](../src/lib/mappers.ts).

## Models (initial)

- **User** — id, role (`listener|artist|support|admin`), email, hashed password,
  system `username`, displayName, avatar, birthDate, gender, subscription (tier +
  expiry), settings (notificationLimit, volume, language), follower/following relations,
  daily-stream stat.
- **Artist** (extends User) — artistName, verification `status` (`pending|approved|rejected`)
  - reason, `verified`, portfolio, aggregate listeners/streams.
- **Song** — title, artist, album (nullable), cover, audio file/stream URL, duration,
  genre, year, lyrics, listeners, streams.
- **Album** — title, artist, cover, releaseType (`single|album`), year, genre, tracks.
- **Playlist** — name, owner, cover, tracks, timestamps.
- **Playback History** — user, song, played timestamp, completion status (for stream counting).
- **Notification** — user, type, title, body, read, link, timestamp.
- (Phase-2 only) **Subscription plan & price**, **Ticket**, **PaymentTransaction**,
  **MonthlyPayout/Audit**.
- ArtistWork / Track Management — artist-owned songs with audio file, lyrics,
  cover image, metadata (genre, release year, collaborators), publication status,
  and statistics.
- AudioFile — uploaded track files with supported formats (MP3/WAV/FLAC),
  storage path, duration, and validation information.

## Endpoints (REST, indicative)

| Area                               | Endpoints                                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Auth                               | `POST /auth/register`, `POST /auth/register/artist`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password` |
| Users                              | `GET/PATCH /users/me`, `GET /users/:id`, `POST /users/:id/follow`, `DELETE /users/:id/follow`, `DELETE /users/me`          |
| Artists                            | `GET /artists/:id`, `GET /artists/:id/discography`                                                                         |
| Catalog                            | `GET /songs`, `GET /albums`, `GET /search?q=` (search + sort/filter)                                                       |
| Playlists                          | `GET/POST /playlists`, `PATCH/DELETE /playlists/:id`, `POST/DELETE /playlists/:id/songs`                                   |
| Player                             | `GET /songs/:id/stream`, `POST /songs/:id/play`, `GET /songs/:id/lyrics`                                                   |
| Queue                              | `GET/POST /users/me/queue`, `PATCH /users/me/queue` (optional queue synchronization)                                       |
| Notifications                      | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`                                       |
| Subscriptions                      | `GET /plans`, `POST /subscriptions` (purchase 1/3/6/12 months)                                                             |
| Payments                           | `POST /payments`, gateway callback, status tracking                                                                        |
| Uploads                            | song audio (MP3/WAV/FLAC) + cover/avatar images, stored properly                                                           |
| Reports                            | aggregated stats for artists / support / admin (computed server-side)                                                      |
| Artist Works                       |
| GET /artists/me/works              | list artist songs/albums with statistics                                                                                   |
| POST /artists/me/works             | upload and publish a new track                                                                                             |
| PATCH /artists/me/works/:id        | edit track metadata                                                                                                        |
| DELETE /artists/me/works/:id       | remove published work                                                                                                      |
| POST /artists/me/albums            | create album                                                                                                               |
| PATCH /artists/me/albums/:id       | update album information                                                                                                   |
| POST /artists/me/albums/:id/tracks | add existing tracks to album                                                                                               |

## Business rules the backend must own

- **Subscription tiers** (see `lib/subscription.ts): playlist limits (6 / 100 / ∞),
  daily stream limit (60 / ∞ / ∞), avatar upload (silver+), download/early-access/stats
  (gold). Pricing is **dynamic** and admin-editable without code changes.
- **Access control**: no user may access resources of equal-or-higher-privilege users,
  or beyond their subscription limits; read/write scopes kept minimal.
- **Subscription lifecycle**: expiry + renewal; periods of 1, 3, 6, 12 months.
- **Notifications** generated server-side per role (expiry warnings, new releases,
  verification results + reason, monthly payout, new tickets/verification requests).
- **Reports** must return **aggregated** numbers (counts/sums), never raw lists for the
  frontend to compute (e.g. user counts, revenue, payouts).
- **Settings sync**: user preferences persist server-side and sync across devices.
- **Artist payout** = function of listeners and stream counts (formula provided in Phase 2).
- **Playback tracking**: completed song plays should update stream counts and listening
  history.
- **Gold-only statistics**: detailed listener and stream statistics must only be available
  for users with Gold subscription.
- **Download access**: offline/download endpoints must verify that the user has a Gold
  subscription.

- Only verified artists may publish works.
- Uploaded audio files must be validated by type and size.
- Supported audio formats are MP3, WAV, and FLAC.
- Tracks are created independently by default and can later be assigned to an album.
- Album membership changes must not duplicate song records.
- Artist statistics (listeners, streams, revenue) are calculated server-side.
- Gold-level statistics visibility rules apply to listeners; artists can view their own
  work statistics.

## Music Player Requirements

- The backend must provide playable song resources through validated audio URLs/files.
- Song responses should include:
  - audio stream URL
  - cover image
  - duration
  - artist information
  - album information
  - optional lyrics
  - listener count
  - total stream count
- Player actions should be supported:
  - play
  - pause (frontend only)
  - seek (frontend only)
  - next/previous queue navigation (frontend or synchronized queue)
  - shuffle and repeat modes (frontend only)
- Queue synchronization is optional, but the backend may support storing a user's active
  queue for multi-device playback.
- Each completed playback should create/update listening history and increase stream count.
- Lyrics should be returned only when available.
- Artist and album links are handled by the frontend but require stable IDs from backend.
- Listener count and stream statistics shown in the player must respect subscription rules.

## Notes carried from Phase 1

- Frontend ↔ backend contracts (request/response shapes), naming and documentation must
  stay consistent; the frontend may be adjusted in Phase 2 to integrate.
- File uploads must be validated and placed in appropriate storage.
- Both projects should be runnable via `docker compose up` (optional bonus).
