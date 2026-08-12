# Trimir Backend

Django + DRF backend for the music-streaming project.

## Apps

| App             | Responsibility                                                        |
| --------------- | --------------------------------------------------------------------- |
| `accounts`      | email-based user, roles, artist profile & verification, follows, auth |
| `catalog`       | subscription plans, albums, songs, play events                        |
| `playlists`     | playlists and their tracks                                            |
| `notifications` | in-app notifications, trimmed to each user's limit                    |
| `support`       | tickets and their message threads                                     |
| `billing`       | subscription payments through the Zarinpal sandbox                    |
| `reports`       | aggregated reports and monthly artist payouts                         |
| `common`        | shared model/permission/upload helpers, `seed_demo`                   |

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo   # demo accounts (password: password123), catalog, tickets
python manage.py runserver
```

`python manage.py test` runs the suite (46 tests).

## Endpoints

Auth

- `POST /api/auth/register/`, `POST /api/auth/artist-register/`
- `POST /api/auth/login/`, `POST /api/auth/refresh/`, `POST /api/auth/logout/`
- `GET/PATCH/DELETE /api/auth/me/`

Accounts

- `GET /api/users/`, `GET /api/users/<id>/` (read-only; users edit themselves via `/auth/me/`)
- `POST|DELETE /api/users/<id>/follow/`
- `POST /api/users/<id>/verify/` — support/admin approve or reject an artist

Catalog

- `GET /api/subscription-plans/` (admins may `PATCH` prices and limits)
- `GET|POST /api/albums/`, `GET|PATCH|DELETE /api/albums/<id>/`
- `GET|POST /api/songs/`, `GET|PATCH|DELETE /api/songs/<id>/`
- `POST /api/songs/<id>/play/` — counts one stream, enforces the daily plan limit (429)
- `GET /api/songs/<id>/download/` — plans with `can_download` only

Playlists

- `GET|POST /api/playlists/`, `GET|PATCH|DELETE /api/playlists/<id>/`
- `POST|DELETE /api/playlists/<id>/songs/<song_id>/`

Notifications & support

- `GET /api/notifications/`, `PATCH|DELETE /api/notifications/<id>/`
- `POST /api/notifications/mark-all-read/`
- `GET|POST /api/tickets/`, `POST /api/tickets/<id>/reply/`, `POST /api/tickets/<id>/close/`

Billing

- `POST /api/payments/start/` — creates a pending payment, returns the gateway URL
- `POST /api/payments/verify/` — confirms the transaction and activates the subscription
- `GET /api/payments/`

Reports (aggregated in the database)

- `GET /api/reports/artist/?month=YYYY-MM` — the caller's own artist report
- `GET /api/reports/overview/` — support/admin summary (tiers, revenue, queues)
- `GET /api/reports/payouts/?month=YYYY-MM`, `POST /api/reports/payouts/<id>/settle/`

## Notes

- Lists are paginated (`?page=`, `?page_size=` up to 200) and support `?search=` and `?ordering=`.
- Counters (`streams_count`, `listeners_count`, `revenue`) are read-only over the API and
  only change through `POST /api/songs/<id>/play/`.
- Uploads validate the extension and size; a track's duration is read from the file itself.
- Payment settings and the payout formula come from the environment — see `.env.example`.
