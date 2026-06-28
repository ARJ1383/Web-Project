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
tailored, role-aware experience. **Phase 1 (this repository) is the frontend**, built
entirely against **mock data persisted in the browser** (Local Storage). **Phase 2** will
add a Django backend and wire it in.

> پروژه‌ی یک سرویس استریم موسیقی مشابه Spotify. فاز اول کاملاً فرانت‌اند است و داده‌ها به‌صورت
> ماک در مرورگر (Local Storage) نگهداری می‌شوند؛ فاز دوم بک‌اند جنگو اضافه خواهد شد.

## ✨ Highlights

- 🌗 **Dark & light themes** — modern neon-purple dark, green-accented light (toggle + persisted)
- 🌐 **Bilingual FA/EN** with full **RTL/LTR** switching
- 📱 **Responsive** across desktop, tablet and mobile
- 🔐 **Role-based** routing & access (listener / artist / support / admin)
- 💳 **Subscription tiers** (basic / silver / gold) gating features from a single rules module
- 📦 **PWA** — installable & offline-capable
- ✅ **44 tests** (Vitest + Testing Library), ESLint + Prettier + Husky + commitlint + CI

## 🧩 Features

- **Authentication** — login and registration for listeners and artists, with form
  validation and a privacy-policy flow.
- **Home** — personalized showcase of playlists, latest releases and popular songs.
- **Profiles** — user profiles with follow/unfollow and inline editing, plus rich artist
  profiles with discography and verification badge.
- **Playlists** — create, rename, delete, and manage tracks, with tier-based limits.
- **Notifications** — role-aware, read/unread states, mark-as-read and empty states.
- **Settings** — theme, language, audio, notifications, subscription and account controls.
- **Theming & i18n** — dark/light themes and bilingual FA/EN with full RTL/LTR support.
- **PWA** — installable and offline-capable.

## 🚀 Getting started

Requires **Node 20.19+** and npm.

```bash
npm install        # installs deps + git hooks
npm run dev        # http://localhost:5173
```

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

> Mock data lives in the browser. To reset it, clear the site's Local Storage.

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

React 18 · Vite · TypeScript · Tailwind CSS · Zustand · React Router · react-i18next ·
Vitest + Testing Library · vite-plugin-pwa.

## 📂 Project structure

```
src/
  app/          router + root component
  components/   ui/ (primitives) · common/ (shared widgets) · layout/ (app shell)
  features/     auth · home · profile · artist · settings · notifications · playlists
  stores/       Zustand stores (auth, catalog, playlists, notifications, theme, language, toast)
  lib/          storage, seed, subscription rules, formatting, route guards
  i18n/         i18next config + fa/en locales
  types/        shared domain models (Phase-2 backend contract)
  styles/       global CSS + theme tokens
  test/         setup + helpers
```

See [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for architecture & coding rules, and
[docs/BACKEND_REQUIREMENTS.md](docs/BACKEND_REQUIREMENTS.md) for the Phase-2 backend plan.

## 🖼️ Screenshots

## 🛣️ Roadmap

- **Phase 1 — Frontend (mock):** this repository.
- **Phase 2 — Backend:** Django + DRF, real auth, file uploads, payments, aggregated
  reports, and integration with this frontend. Optional: Dockerized `docker compose up`.

## License

[MIT](LICENSE) © 2026 Trimir Team.
