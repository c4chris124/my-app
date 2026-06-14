# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Yarn Workspaces v4 monorepo with three packages:

- **`apps/api`** — NestJS REST API (`@myapp/api`) backed by PostgreSQL + TypeORM
- **`apps/web`** — React 19 + Vite frontend (`@myapp/web`)
- **`packages/shared`** — TypeScript interfaces, DTOs, and utilities consumed by both apps

All `yarn` commands must be run from the **monorepo root**, never from inside individual app folders.

## Common commands

```bash
# Install
yarn install

# Local dev (requires local Postgres + Redis)
yarn dev:api          # builds shared, then starts NestJS in watch mode
yarn dev:web          # starts Vite dev server on :5173
yarn dev:all          # both concurrently

# Docker dev (recommended — no local DB required)
yarn docker:dev:all   # API + Web + Postgres + Redis
yarn docker:dev:api   # databases + API only
yarn docker:dev:infra # databases only

# Build
yarn build:all        # topological build (shared → api → web)

# Tests
yarn workspace @myapp/api test                          # API unit tests (Jest)
yarn workspace @myapp/api test:e2e                      # API e2e tests
yarn workspace @myapp/web test run                      # web tests, one-shot (Vitest)
yarn workspace @myapp/web test:unit                     # web unit project only
yarn workspace @myapp/web test:storybook                # Storybook interaction tests (Playwright)

# Single test file
yarn workspace @myapp/api test -- --testPathPattern=products
yarn workspace @myapp/web test run src/components/ThemeToggle.test.tsx

# Database migrations (run from apps/api/)
yarn workspace @myapp/api migration:run
yarn workspace @myapp/api migration:generate -- -n MigrationName
yarn workspace @myapp/api migration:revert

# Storybook
yarn workspace @myapp/web storybook   # on :6006
```

## Architecture

### `packages/shared`

Barrel-exported from `src/index.ts`. Contains `dto/`, `interfaces/`, `types/`, and `utils/`. TypeScript resolves it directly to source via `tsconfig.base.json` paths — no compilation needed during development. In production the topological build compiles it first.

### `apps/api` — NestJS

Standard NestJS module layout. Domain modules are registered in `AppModule` (`src/app.module.ts`):

- `ProductsModule`, `CategoriesModule`, `BrandsModule`, `SuppliersModule`, `PricingModule`, `SeedModule`
- `DatabaseModule` — TypeORM configured async from `ConfigService`; `synchronize: false`, migrations managed manually

Each domain module follows the pattern `<domain>.module.ts` / `<domain>.service.ts` / `<domain>.controller.ts` with `entities/` and `dto/` subdirectories.

Migrations live in `apps/api/migrations/` and run via `tsx` against `src/database/data-source.ts`.

`ConfigModule` is global and reads `.env` from the app root then `../../.env` (monorepo root).

### `apps/web` — React + Vite

`src/App.tsx` is a thin router; domain modules are `lazy()`-loaded:

```
src/modules/<domain>/
  index.tsx        # <Routes>, lazy-loaded entry
  layouts/         # shared chrome via react-router <Outlet>
  pages/           # route components
  components/      # domain-specific UI
  services/        # <domain>Api.ts (fetchers) + queries.ts (React Query hooks)
  data/types.ts    # domain TypeScript types
  guards/          # route guards (CRM only)
```

**Data fetching layers:**
1. `src/services/apiClient.ts` — single axios instance (`VITE_API_URL` or `/api`)
2. `modules/<domain>/services/<domain>Api.ts` — one function per endpoint
3. `modules/<domain>/services/queries.ts` — React Query hooks; components only call hooks

**Auth:** Zustand store with `persist` middleware in `src/services/authStore.ts` (localStorage key `rehobot-auth`). Roles: `customer | admin | manager`. CRM routes are gated by `modules/crm/guards/RequireCrmAuth.tsx`.

**MSW mocking:** Active in dev only. Handlers composed in `src/mocks/handlers.ts` from per-domain files. Paths match axios `baseURL` (`/api/...`). Disable with `VITE_ENABLE_MSW=false`. When adding an endpoint, add both a fetcher and a matching handler.

**Styling:** "Industrial Excellence" design system — CSS custom properties in `src/index.css`, mapped to semantic Tailwind utilities (`bg-surface`, `text-on-surface`, `bg-primary`, etc.). Use semantic classes, not raw colors — they adapt to the theme. Border radius is globally `0px` (sharp/industrial) except `rounded-full`. Theme state in `src/theme/themeStore.ts`.

**i18n:** i18next, Spanish (`es`) fallback, English (`en`). Namespaced JSON under `public/locales/<lng>/<ns>.json`. Namespaces: `translation` (default), `common`, `ecommerce`, `crm`. Add keys to **every** locale file for a namespace.

**Testing:** Vitest with two projects — `unit` (node env, opt into jsdom per-file) and `storybook` (real Chromium via Playwright). Storybook tests require `yarn exec playwright install chromium` if missing.

## Docker Compose architecture

`docker/docker-compose.yml` is the base — never run alone. Each environment adds a mandatory override:

| Override | Purpose |
|---|---|
| `docker-compose.dev.yml` | Bind mounts, hot-reload, exposes all ports |
| `docker-compose.test.yml` | tmpfs DBs, no ports, runs test suites |
| `docker-compose.prod.yml` | Optimized images, Nginx for frontend |

Services use profiles (`infrastructure`, `api`, `web`, `all`) to start subsets. Build contexts use `context: ..` (monorepo root) so Dockerfiles can access `packages/shared`.

`POSTGRES_PASSWORD` is required with no default — set it in `.env` at the monorepo root (copy from `.env.example`).
