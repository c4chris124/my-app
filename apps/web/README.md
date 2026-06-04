# @myapp/web

REHOBOT web app — React 19 + TypeScript + Vite, with an **"Industrial Excellence"**
design system (light/dark), i18n (Spanish/English), Storybook, and Vitest.

All commands below are run from the repo root via the workspace, e.g.
`yarn workspace @myapp/web <script>`. You can also `cd apps/web` and run `yarn <script>`.

## Quick start

```bash
yarn install                          # from the repo root, installs all workspaces
yarn workspace @myapp/web dev         # start the app on http://localhost:5173
```

## Scripts

| Script | Command | What it does |
| --- | --- | --- |
| `dev` | `vite` | Dev server with HMR on port `5173` |
| `build` | `tsc -b && vite build` | Type-check then produce a production build in `dist/` |
| `preview` | `vite preview` | Serve the production build locally |
| `lint` | `eslint .` | Lint the project |
| `test` | `vitest` | Run **all** tests (unit + Storybook) in watch mode |
| `test:unit` | `vitest --project=unit` | Run only the unit tests (jsdom) |
| `test:storybook` | `vitest --project=storybook` | Run only the Storybook interaction tests (browser) |
| `test:ui` | `vitest --ui` | Run tests with the Vitest UI |
| `test:coverage` | `vitest run --coverage` | Run tests once with a coverage report |
| `storybook` | `storybook dev -p 6006` | Start Storybook on port `6006` |
| `build-storybook` | `storybook build` | Build a static Storybook into `storybook-static/` |

## Running tests

Tests use [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com),
split into two Vitest projects (see [`vitest.config.ts`](vitest.config.ts)):

- **`unit`** — runs in `jsdom` (set per-file with `// @vitest-environment jsdom`).
- **`storybook`** — runs every story's `play` function in a **real Chromium browser**
  via [`@storybook/addon-vitest`](https://storybook.js.org/docs/writing-tests) + Playwright.

```bash
# Watch mode — runs BOTH projects (unit + Storybook browser)
yarn workspace @myapp/web test

# Run once (CI-style) and exit
yarn workspace @myapp/web test run

# Only one project
yarn workspace @myapp/web test:unit
yarn workspace @myapp/web test:storybook

# A single file
yarn workspace @myapp/web test run src/components/ThemeToggle.test.tsx

# Interactive UI / coverage
yarn workspace @myapp/web test:ui
yarn workspace @myapp/web test:coverage
```

> The Storybook project needs Playwright's Chromium. If it's missing, install it once
> with `yarn workspace @myapp/web exec playwright install chromium`.

What's covered today:

- **`src/__tests__/project-setup.test.ts`** — verifies the project setup itself:
  Tailwind, i18n translations, and Storybook are configured.
- **`src/components/ThemeToggle.test.tsx`** — unit-level guard for the light/dark toggle
  (stuck on one mode, button no longer flipping, shared store out of sync).
- **`src/components/ThemeToggle.stories.tsx`** (`TogglesOnClick`) — browser interaction
  test that clicks the real button and asserts the `.dark` class flips on `<html>`.

## Running Storybook

Storybook 10 + React/Vite. The preview wires in the Tailwind tokens and i18n, and the
toolbar **theme switcher** flips every story between the light and dark design tokens.

```bash
yarn workspace @myapp/web storybook        # http://localhost:6006
yarn workspace @myapp/web build-storybook  # static build in storybook-static/
```

Stories live next to their components as `*.stories.tsx`:

- `Components/Button`
- `Components/StatusChip`
- `Components/ThemeToggle`
- `Example/Welcome`

## Design system

The "Industrial Excellence" tokens are defined as CSS variables in
[`src/index.css`](src/index.css) — `:root` for light, `.dark` for dark — and mapped to
Tailwind utilities in [`tailwind.config.js`](tailwind.config.js). Use the semantic
classes (`bg-surface`, `text-on-surface`, `bg-accent`, `font-display`, `px-margin-desktop`,
`shadow-pressed`, …); they adapt to the active theme automatically. Theme state lives in
[`src/theme/themeStore.ts`](src/theme/themeStore.ts) (Zustand) and toggles the `.dark`
class on `<html>`, persisting the choice to `localStorage`.

## Internationalization

i18next + react-i18next, configured in [`src/i18n.ts`](src/i18n.ts), with Spanish (`es`)
as the fallback and English (`en`) alongside. Translation files are static JSON under
[`public/locales/<lng>/<ns>.json`](public/locales), split into namespaces:
`translation` (default), `common`, `ecommerce`, and `crm`.

Add a key to the relevant namespace in **every** locale, then read it with
`useTranslation()` for the default namespace or `useTranslation("<ns>")` for a specific
one:

```ts
const { t } = useTranslation();        // default `translation` namespace
const { t } = useTranslation("crm");   // the `crm` namespace
t("yourKey");
```

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 3 · Zustand · i18next · Storybook 10 · Vitest
