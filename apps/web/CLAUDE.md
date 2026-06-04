# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

This is the `@myapp/web` workspace (REHOBOT web app) inside a Yarn v4 monorepo at
`../../`. The root README covers the API (NestJS), the `@myapp/shared` package, and
Docker; this file focuses on the React frontend, which is where most work happens.

## Commands

Run from this directory (`apps/web`) with `yarn <script>`, or from the repo root as
`yarn workspace @myapp/web <script>`. Always `yarn install` from the **repo root**.

| Command | Purpose |
| --- | --- |
| `yarn dev` | Vite dev server on `:5173` (MSW intercepts API calls — no backend needed) |
| `yarn build` | `tsc -b && vite build` — type-check then production build to `dist/` |
| `yarn lint` | ESLint over the project |
| `yarn test` | Vitest **watch**, runs both projects (unit + storybook browser) |
| `yarn test run` | Run once, CI-style |
| `yarn test:unit` | Unit project only (node env) |
| `yarn test:storybook` | Storybook interaction tests only (real Chromium) |
| `yarn storybook` | Storybook on `:6006` |

Single test file: `yarn test run src/components/ThemeToggle.test.tsx`.
There is no `type-check` script here — use `yarn build` (or root `yarn type-check`).

The storybook test project needs Playwright Chromium:
`yarn exec playwright install chromium` if it's missing.

## Architecture

### Domain modules + code splitting

`src/App.tsx` is a thin router: `/` → `LandingPage`, `/ecommerce/*` and `/crm/*` are
`lazy()`-imported domain modules, each shipping as its own chunk. Each module under
`src/modules/<domain>/` is self-contained with the same internal shape:

```
modules/<domain>/
  index.tsx      # the module's <Routes> (default export, lazy-loaded by App)
  layouts/       # shared chrome (navbar/sidebar) via react-router <Outlet>
  pages/         # route components
  components/    # domain-specific UI
  services/      # <domain>Api.ts (fetch fns) + queries.ts (React Query hooks)
  data/types.ts  # domain TypeScript types
  guards/        # route guards (CRM only)
```

When adding a domain, mirror this layout and lazy-load it from `App.tsx`.

### Data fetching: three layers

1. **`src/services/apiClient.ts`** — single axios instance, `baseURL` from
   `VITE_API_URL` (default `/api`). `setAuthToken()` lives here; the auth store
   depends on the client, never the reverse.
2. **`modules/<domain>/services/<domain>Api.ts`** — thin one-fn-per-endpoint fetchers
   returning typed data.
3. **`modules/<domain>/services/queries.ts`** — React Query `useQuery` hooks wrapping
   the fetchers, plus a centralized `<domain>Keys` object for cache keys. Components
   only ever call the hooks.

The single `QueryClient` (`src/services/queryClient.ts`) has `staleTime: 60s` and
`refetchOnWindowFocus: false` (catalog data changes rarely).

### Auth

`src/services/authStore.ts` is a Zustand store with `persist` middleware (localStorage
key `rehobot-auth`). It persists only `{ user, token }`, re-applies the bearer token to
axios via `onRehydrateStorage`, and `login(credentials, domain)` tags the request with
the originating storefront. Roles: `customer | admin | manager`; `CRM_ROLES =
["admin", "manager"]`. The CRM gates protected routes with
`modules/crm/guards/RequireCrmAuth.tsx` (redirects to `/crm/login`, preserving
`location.state.from`). Ecommerce auth-guarded routes are planned but not yet built.

### Mocking (MSW)

In **dev only**, `src/main.tsx` awaits `enableMocking()` before mounting so first
queries are intercepted. Handlers are composed in `src/mocks/handlers.ts` from
per-domain files (`auth.handlers.ts`, `crm.handlers.ts`, `ecommerce.handlers.ts`) with
`*.seed.ts` fixtures. Handler paths match the axios `baseURL` (`/api/...`). MSW is
dynamically imported so it's never in the production bundle. Disable with
`VITE_ENABLE_MSW=false`. When you add an endpoint, add both a fetcher and a matching
handler.

### Styling — "Industrial Excellence" design system

Colors are CSS custom properties in `src/index.css` (`:root` light, `.dark` dark),
stored as space-separated RGB channels so Tailwind opacity modifiers work, and mapped
to semantic Tailwind utilities in `tailwind.config.js`. **Use the semantic classes**
(`bg-surface`, `text-on-surface`, `bg-primary`, `font-display`, `shadow-pressed`, …)
rather than raw colors — they adapt to the theme automatically. Border radius is
globally `0px` (sharp/industrial) except `rounded-full`. Theme state lives in
`src/theme/themeStore.ts` (Zustand, toggles `.dark` on `<html>`, persists to
localStorage).

### i18n

i18next + react-i18next (`src/i18n.ts`), Spanish (`es`) fallback, English (`en`).
Translations are **namespaced** JSON under `public/locales/<lng>/<ns>.json` — namespaces
are `translation` (default), `common`, `ecommerce`, `crm`. Read a namespaced key with
`useTranslation("crm")`. Add a key to **every** locale file for a namespace.

### Testing setup

`vitest.config.ts` defines two projects:
- **`unit`** — node env; opt into jsdom per-file with `// @vitest-environment jsdom`.
  Includes `src/**/*.{test,spec}.{ts,tsx}`, excludes stories.
- **`storybook`** — runs every story's `play` function in real Chromium (Playwright).
  `@storybook/addon-vitest` auto-applies the `.storybook/preview.tsx` annotations
  (theme decorator, i18n, global CSS) to each story.

Stories live next to components as `*.stories.tsx`. The preview wires in Tailwind tokens
and i18n and exposes a toolbar theme switcher.

## Conventions

- `@myapp/shared` resolves to the package's **TS source** (not `dist/`) in dev via a
  Vite alias and `tsconfig.base.json` paths — no build step needed while developing.
- The Vite dev server uses `usePolling` and proxies `/api` → the API container; these
  exist for Docker Desktop on macOS/Windows. On native Linux Docker, polling can be off.
- `VITE_*` env vars are baked in at **build time** — changing them needs a rebuild.
