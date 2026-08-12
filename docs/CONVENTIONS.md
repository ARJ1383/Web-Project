# Conventions & Architecture

This document explains **how** the codebase is organized and the rules we follow, so the
project stays clean and maintainable (PDF grading: تمیزی کد + تغییرپذیری + رعایت
استانداردها). It also doubles as material for the final report.

## Tech stack

| Concern   | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | React 18 + Vite                                     |
| Language  | TypeScript (strict)                                 |
| Styling   | Tailwind CSS + CSS-variable theme tokens            |
| State     | Zustand (server data via the API client)            |
| Routing   | React Router v6                                     |
| i18n      | react-i18next (FA/EN, RTL/LTR)                      |
| Backend   | Django 5 + DRF (`backend/`), JWT auth               |
| Testing   | Vitest + React Testing Library, Django test runner  |
| PWA       | vite-plugin-pwa                                     |
| Tooling   | ESLint, Prettier, Husky, commitlint, GitHub Actions |

## Folder structure

```
src/
  app/         App composition: router, root component
  components/
    ui/        Generic, reusable, presentational primitives (Button, Modal, …)
    common/    Domain-aware but shared widgets (SongCard, NotificationCard, …)
    layout/    App shell (Sidebar, Topbar, AppLayout, PlayerBarSlot)
  features/    One folder per screen/feature (auth, home, profile, …)
  stores/      Zustand stores (one concern each)
  lib/         Framework-agnostic helpers (api, mappers, subscription rules, …)
  i18n/        i18next config + locale JSON
  types/       Shared domain models (what the mappers produce)
  styles/      Global CSS + theme tokens
  test/        Test setup + helpers
```

**Why feature folders?** Each section of the spec maps to one folder, so the three of
us can work in parallel with minimal merge conflicts, and a screen's logic, UI and local
components live together.

## Naming

| Thing                       | Convention            | Example                 |
| --------------------------- | --------------------- | ----------------------- |
| Components & files (`.tsx`) | `PascalCase`          | `PlaylistCard.tsx`      |
| Hooks / stores              | `useX`                | `usePlaylistStore`      |
| Non-component files         | `camelCase`           | `subscription.ts`       |
| Variables & functions       | `camelCase`           | `canCreatePlaylist`     |
| Types & interfaces          | `PascalCase`          | `SubscriptionTier`      |
| Constants                   | `UPPER_SNAKE_CASE`    | `TIER_CAPABILITIES`     |
| i18n keys                   | `dot.case` namespaced | `playlists.createFirst` |
| Branches                    | `type/kebab-case`     | `feat/playlists-page`   |

## Patterns & rules

- **No hard-coded business rules in components.** Tier limits/capabilities live only in
  `lib/subscription.ts` so price/limit changes never touch UI code.
- **No hard-coded strings in the UI.** Every user-facing string is an i18n key in both
  `fa.json` and `en.json`.
- **Theme via tokens.** Use semantic Tailwind colors (`bg`, `surface`, `accent`, `text`,
  `muted`, …) that resolve to CSS variables — never raw hex in components.
- **RTL-safe styling.** Prefer logical utilities (`ps`/`pe`, `ms`/`me`, `start`/`end`,
  `rtl:`/`ltr:`) so the same code works in both directions.
- **Stores are the source of truth for the UI.** Components read through selectors and
  write through store actions; the actions are the only place that calls the API.
- **One HTTP layer.** Every request goes through `lib/api.ts` (base URL, JWT, refresh,
  errors), and every payload is normalized by `lib/mappers.ts` so components never see
  snake_case or numeric ids.
- **The backend owns the rules.** Subscription limits and prices, stream counting and all
  report numbers come from the API; `lib/subscription.ts` only caches what it fetched.

## Demo data

`python manage.py seed_demo` (in `backend/`) creates the demo accounts — password
`password123`, covering all four roles — plus the catalog, playlists and tickets. Only the
theme and language are cached in Local Storage.
