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
| State     | Zustand (+ `persist` → Local Storage)               |
| Routing   | React Router v6                                     |
| i18n      | react-i18next (FA/EN, RTL/LTR)                      |
| Testing   | Vitest + React Testing Library                      |
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
  lib/         Framework-agnostic helpers (storage, seed, subscription rules, …)
  i18n/        i18next config + locale JSON
  types/       Shared domain models (the Phase-2 backend contract)
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
- **Stores are the source of truth.** Components read/write through Zustand stores;
  persistence is handled by the `persist` middleware via `lib/storage.ts`.
- **Mock layer is swappable.** All persistence goes through `lib/storage.ts`; in Phase 2
  the stores' actions become API calls with the same shapes from `types/models.ts`.

## Mock data (Phase 1)

Seed data lives in `lib/seed.ts` and is loaded into the stores on first run. Demo
accounts (password `password123`) cover all four roles — see the login screen.
