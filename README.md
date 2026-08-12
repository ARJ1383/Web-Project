<div align="center">

# 🎵 Trimir

**A Spotify-like music streaming platform** — _bilingual (FA/EN), themeable, responsive._

_Trimir = **Tri** + Am**ir** — built by three Amirs._

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?logo=pwa&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

## 👥 Team — تیم

| Name                      | نام                 |
| ------------------------- | ------------------- |
| Amir Masoud Ebrahimi      | امیرمسعود ابراهیمی  |
| Amir Reza Jafari          | امیررضا جعفری       |
| Amir Hossein Yeganehdoost | امیرحسین یگانه‌دوست |

## 📖 About

Trimir is a music-streaming web app developed as the course project. It serves four kinds
of users — **listeners, artists, support agents, and a system admin** — each with a
tailored, role-aware experience. The repository holds both phases: the **React frontend**
(`src/`) and the **Django + DRF backend** (`backend/`) it talks to over a REST API.

> پروژه‌ی یک سرویس استریم موسیقی مشابه Spotify. فاز اول فرانت‌اند (React) و فاز دوم بک‌اند
> جنگو است؛ هر دو در همین ریپو قرار دارند و از طریق REST به هم متصل‌اند.

## ✨ Highlights

- 🌗 **Dark & light themes** — modern neon-purple dark, green-accented light (toggle + persisted)
- 🌐 **Bilingual FA/EN** with full **RTL/LTR** switching
- 📱 **Responsive** across desktop, tablet and mobile
- 🔐 **Role-based** routing & access (listener / artist / support / admin)
- 💳 **Subscription tiers** (basic / silver / gold) — limits and prices come from the backend,
  so an admin can re-price without a code change
- 💳 **Payments** through the Zarinpal sandbox gateway
- 📊 **Aggregated reports** computed in the database (artist stats, admin overview, payouts)
- 📦 **PWA** — installable & offline-capable
- ✅ **72 frontend tests** (Vitest) + **46 backend tests** (Django), ESLint + Prettier + Husky + CI

## 🧩 Features

- **Authentication** — login and registration for listeners and artists, with form
  validation and a privacy-policy flow.
- **Home** — personalized showcase of playlists, latest releases and popular songs.
- **Profiles** — user profiles with follow/unfollow and inline editing, plus rich artist
  profiles with discography and verification badge.
- **Playlists** — create, rename, delete, and manage tracks, with tier-based limits.
- **Notifications** — role-aware, read/unread states, mark-as-read and empty states.
- **Settings** — theme, language, audio and notification preferences stored on the account,
  subscription purchase through the payment gateway, and account deletion.
- **Support** — tickets with a message thread; support agents reply and close them.
- **Dashboard** — artist verification, tickets, monthly payout audit and subscription pricing.
- **Theming & i18n** — dark/light themes and bilingual FA/EN with full RTL/LTR support.
- **PWA** — installable and offline-capable.

## 🚀 Getting started

Requires **Node 20.19+** with npm, and **Python 3.12+** for the backend.

**Backend** (`http://localhost:8000`):

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo                        # demo accounts, catalog, tickets
python manage.py runserver
```

**Frontend** (`http://localhost:5173`):

```bash
npm install        # installs deps + git hooks
npm run dev
```

The frontend reads the API base URL from `VITE_API_BASE_URL` (see `.env.example`); it
defaults to `http://localhost:8000/api`.

### Demo accounts

All demo accounts use the password **`password123`**:

| Email                | Role / tier           |
| -------------------- | --------------------- |
| `sara@trimir.app`    | Listener · **Gold**   |
| `nina@trimir.app`    | Listener · **Silver** |
| `ali@trimir.app`     | Listener · **Basic**  |
| `aurora@trimir.app`  | **Artist** (approved) |
| `mehr@trimir.app`    | **Artist** (pending)  |
| `support@trimir.app` | **Support**           |
| `admin@trimir.app`   | **Admin**             |

> The accounts above are created by `python manage.py seed_demo`; run it again to top the
> data back up. Only the browser theme and language are cached locally — everything else
> lives in the backend.

## 📜 Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start the dev server                     |
| `npm run build`      | Type-check + production build (with PWA) |
| `npm run preview`    | Preview the production build             |
| `npm run test`       | Run the test suite (Vitest)              |
| `npm run test:watch` | Tests in watch mode                      |
| `npm run lint`       | ESLint (zero warnings allowed)           |
| `npm run format`     | Format with Prettier                     |
| `npm run typecheck`  | TypeScript, no emit                      |

## 🧱 Tech stack

**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · Zustand · React Router ·
react-i18next · Vitest + Testing Library · vite-plugin-pwa.

**Backend:** Django 5 · Django REST Framework · SimpleJWT · django-filter · Pillow ·
mutagen · SQLite.

## 📂 Project structure

```
src/
  app/          router + root component
  components/   ui/ (primitives) · common/ (shared widgets) · layout/ (app shell)
  features/     auth · home · profile · artist · settings · notifications · playlists
  stores/       Zustand stores (auth, catalog, playlists, notifications, dashboard, player, …)
  lib/          api client, payload mappers, subscription rules, preferences, guards
  i18n/         i18next config + fa/en locales
  types/        shared domain models
  styles/       global CSS + theme tokens
  test/         setup, render helpers, API mock
backend/
  trimir/       settings + root urls
  apps/
    accounts/   user, artist profile, follows, auth endpoints
    catalog/    subscription plans, albums, songs, play events
    playlists/  playlists and their items
    notifications/ in-app notifications
    support/    tickets and messages
    billing/    payments through the Zarinpal sandbox
    reports/    aggregated reports and artist payouts
    common/     shared model/permission/upload helpers + seed_demo command
```

See [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for architecture & coding rules, and
[docs/BACKEND_REQUIREMENTS.md](docs/BACKEND_REQUIREMENTS.md) for the Phase-2 backend plan.

## 🖼️ Screenshots

## 🛣️ Roadmap

- **Phase 1 — Frontend:** done (`src/`).
- **Phase 2 — Backend & integration:** done (`backend/`) — JWT auth, file uploads, payment
  gateway, aggregated reports and the frontend wired to the API.

## License

[MIT](LICENSE) © 2026 Trimir Team.
