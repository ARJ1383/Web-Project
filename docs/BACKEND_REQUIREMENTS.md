# Backend Requirements (for Phase 2)

Per the project brief (note #12), while building the Phase-1 frontend we record the
backend needs it implies. Phase 2 will implement these with **Django + DRF** and replace
the Local-Storage mock. The data shapes mirror [`src/types/models.ts`](../src/types/models.ts).

## Models (initial)

- **User** — id, role (`listener|artist|support|admin`), email, hashed password,
  system `username`, `displayName`, avatar, birthDate, gender, subscription (tier +
  expiry), settings (notificationLimit, volume, language), follower/following relations,
  daily-stream stat.
- **Artist** (extends User) — artistName, verification `status` (`pending|approved|
rejected`) + reason, `verified`, portfolio, aggregate listeners/streams.
- **Song** — title, artist, album (nullable), cover, duration, genre, year, lyrics,
  listeners, streams.
- **Album** — title, artist, cover, releaseType (`single|album`), year, genre, tracks.
- **Playlist** — name, owner, cover, tracks, timestamps.
- **Notification** — user, type, title, body, read, link, timestamp.
- (Phase-2 only) **Subscription plan & price**, **Ticket**, **PaymentTransaction**,
  **MonthlyPayout/Audit**.

## Endpoints (REST, indicative)

| Area          | Endpoints                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /auth/register`, `POST /auth/register/artist`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password` |
| Users         | `GET/PATCH /users/me`, `GET /users/:id`, `POST /users/:id/follow`, `DELETE /users/:id/follow`, `DELETE /users/me`          |
| Artists       | `GET /artists/:id`, `GET /artists/:id/discography`                                                                         |
| Catalog       | `GET /songs`, `GET /albums`, `GET /search?q=` (search + sort/filter)                                                       |
| Playlists     | `GET/POST /playlists`, `PATCH/DELETE /playlists/:id`, `POST/DELETE /playlists/:id/songs`                                   |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`                                       |
| Subscriptions | `GET /plans`, `POST /subscriptions` (purchase 1/3/6/12 months)                                                             |
| Payments      | `POST /payments`, gateway callback, status tracking                                                                        |
| Uploads       | song audio (MP3/WAV/FLAC) + cover/avatar images, stored properly                                                           |
| Reports       | aggregated stats for artists / support / admin (computed server-side)                                                      |

## Business rules the backend must own

- **Subscription tiers** (see `lib/subscription.ts`): playlist limits (6 / 100 / ∞),
  daily stream limit (60 / ∞ / ∞), avatar upload (silver+), download/early-access/stats
  (gold). Pricing is **dynamic** and admin-editable without code changes.
- **Access control**: no user may access resources of equal-or-higher-privilege users, or
  beyond their subscription limits; read/write scopes kept minimal.
- **Subscription lifecycle**: expiry + renewal; periods of 1, 3, 6, 12 months.
- **Notifications** generated server-side per role (expiry warnings, new releases,
  verification results + reason, monthly payout, new tickets/verification requests).
- **Reports** must return **aggregated** numbers (counts/sums), never raw lists for the
  frontend to compute (e.g. user counts, revenue, payouts).
- **Settings sync**: user preferences persist server-side and sync across devices.
- **Artist payout** = function of listeners and stream counts (formula provided in Phase 2).

## Notes carried from Phase 1

- Frontend ↔ backend contracts (request/response shapes), naming and documentation must
  stay consistent; the frontend may be adjusted in Phase 2 to integrate.
- File uploads must be validated and placed in appropriate storage.
- Both projects should be runnable via `docker compose up` (optional bonus).
