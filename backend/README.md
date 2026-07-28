# Trimir Backend

Django + DRF backend scaffold for the music-streaming project.

## What is included

- Custom email-based user model with listener / artist / support / admin roles
- Artist approval profile
- Songs, albums, playlists, playlist items
- Subscription plans for dynamic pricing
- JWT authentication
- REST CRUD endpoints with role/ownership permissions
- Multipart upload support for covers, avatars, and audio files

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Main API endpoints

- `POST /api/auth/register/`
- `POST /api/auth/artist-register/`
- `POST /api/auth/login/`
- `GET/PATCH/DELETE /api/auth/me/`
- `GET /api/users/`
- `GET /api/users/<id>/`
- `POST/DELETE /api/users/<id>/follow/`
- `GET /api/albums/`
- `GET /api/albums/<id>/`
- `POST /api/albums/`
- `PATCH/PUT/DELETE /api/albums/<id>/`
- `GET /api/songs/`
- `GET /api/songs/<id>/`
- `POST /api/songs/`
- `PATCH/PUT/DELETE /api/songs/<id>/`
- `GET /api/playlists/`
- `GET /api/playlists/<id>/`
- `POST /api/playlists/`
- `PATCH/PUT/DELETE /api/playlists/<id>/`
- `POST /api/playlists/<playlist_id>/songs/<song_id>/`
- `DELETE /api/playlists/<playlist_id>/songs/<song_id>/`
- `GET /api/subscription-plans/`
- `GET /api/subscription-plans/<id>/`

## Notes

- `PUT`/`PATCH` is only exposed where updating the resource is meaningful.
- Playlist song management uses dedicated subresource endpoints.
- All media fields are ready for later upload integration.
- The design is intentionally minimal so Phase 3.2+ can be added without reworking the core models.
