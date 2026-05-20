# myapp

A full-stack monorepo built with Yarn Workspaces v4, NestJS, React + Vite, and Docker.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [Docker](#docker)
- [Shared Package](#shared-package)
- [Environment Variables](#environment-variables)
- [Scripts Reference](#scripts-reference)

---

## Project Structure

```
myapp/
├── apps/
│   ├── api/          # NestJS backend (REST API)
│   └── web/          # React + Vite frontend
├── packages/
│   └── shared/       # Shared TypeScript interfaces, DTOs, and utilities
├── docker/
│   ├── docker-compose.yml        # Base service definitions
│   ├── docker-compose.dev.yml    # Development overrides
│   ├── docker-compose.test.yml   # Testing overrides
│   └── docker-compose.prod.yml   # Production overrides
├── .yarnrc.yml
├── package.json
└── tsconfig.base.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Package Manager | Yarn v4 (Berry) with Workspaces |
| Backend | NestJS |
| Frontend | React + Vite |
| Shared Code | TypeScript (interfaces, DTOs, utils) |
| Database | PostgreSQL |
| Cache | Redis |
| Infrastructure | Docker + Docker Compose |

---

## Prerequisites

Make sure you have the following installed before continuing:

- **Node.js** v20 or higher
- **Yarn** v4 — managed via Corepack (`corepack enable`)
- **Docker** and **Docker Compose** v2

Verify your setup:

```bash
node --version    # v20.x.x
yarn --version    # 4.x.x
docker --version  # Docker version 24.x.x or higher
```

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/myapp.git
cd myapp

# 2. Enable Corepack (manages the Yarn version automatically)
corepack enable

# 3. Install all workspace dependencies from the root
yarn install

# 4. Set up environment variables
cp .env.example .env
# Edit .env and fill in your values
```

> **Important:** Always run `yarn install` from the **monorepo root**, never from inside individual app folders. Yarn Workspaces manages the entire dependency graph from the root.

---

## Development

### Option A — Docker (recommended)

Runs all services in containers with hot-reloading enabled for both the API and frontend.

```bash
# Start everything (API + Web + PostgreSQL + Redis)
yarn docker:dev:all

# Start only the databases and API (no frontend)
yarn docker:dev:api

# Start only the databases
yarn docker:dev:infra
```

Service URLs when running via Docker:

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (NestJS) | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Option B — Local (no Docker)

Requires PostgreSQL and Redis running locally or via a separate Docker command.

```bash
# Terminal 1 — compile shared package in watch mode
yarn workspace @myapp/shared dev

# Terminal 2 — start NestJS with file watcher
yarn dev:api

# Terminal 3 — start Vite dev server
yarn dev:web

# Or run API + Web together with one command
yarn dev:all
```

---

## Docker

The Docker setup supports three environments via Compose override files.

### Commands

```bash
# Development — hot-reloading, exposed DB ports, bind mounts
yarn docker:dev:all       # All services
yarn docker:dev:api       # Databases + API only
yarn docker:dev:infra     # Databases only
yarn docker:dev:web       # Databases + API + Web

# Production — optimized images, Nginx for frontend
yarn docker:prod

# Testing — ephemeral in-memory databases, runs test suites
yarn docker:test
```

### How hot-reloading works in Docker

Source files are **bind-mounted** from your host machine into the containers. When you save a file, the change is immediately visible inside the container — no image rebuild required.

- **NestJS** uses `nest start --watch` (backed by chokidar) to detect changes and restart.
- **Vite** uses filesystem polling (`usePolling: true`) to guarantee HMR works through Docker Desktop's virtualization layer on macOS and Windows.

---

## Shared Package

The `packages/shared` workspace contains TypeScript interfaces, DTOs, and utility functions consumed by both `apps/api` and `apps/web`.

### Usage

Import directly using the workspace alias:

```typescript
import { UserDto, ApiResponse } from '@myapp/shared';
```

### How the linking works

- **Yarn** symlinks `packages/shared` into `node_modules/@myapp/shared` automatically after `yarn install`.
- **TypeScript** resolves the types via `paths` configured in `tsconfig.base.json`.
- In **development**, both apps consume the raw TypeScript source — no compilation step needed.
- In **production builds**, the shared package is compiled to `dist/` first (topological build order ensures this).

### Adding new shared types

```
packages/shared/src/
├── dto/            # Data Transfer Objects (used in API request/response shapes)
├── interfaces/     # Pure TypeScript interfaces
├── utils/          # Shared utility functions
└── index.ts        # Barrel export — add new exports here
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. Never commit `.env`.

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | Database name | `appdb` |
| `POSTGRES_USER` | Database user | `appuser` |
| `POSTGRES_PASSWORD` | Database password | — |
| `JWT_SECRET` | Secret for JWT signing | — |
| `NODE_ENV` | Runtime environment | `development` |
| `VITE_API_URL` | API base URL (baked into frontend at build time) | `http://localhost:3000` |

> **Note:** `VITE_*` variables are embedded into the frontend bundle at **build time**. Changing them requires a rebuild — they are not read at runtime like NestJS environment variables.

---

## Scripts Reference

All scripts are run from the **monorepo root**.

### Development

| Script | Description |
|---|---|
| `yarn dev:api` | Start NestJS in watch mode |
| `yarn dev:web` | Start Vite dev server |
| `yarn dev:all` | Start both concurrently |

### Build

| Script | Description |
|---|---|
| `yarn build:api` | Build NestJS for production |
| `yarn build:web` | Build Vite for production |
| `yarn build:all` | Build all workspaces in dependency order |

### Testing

| Script | Description |
|---|---|
| `yarn test:api` | Run API unit tests |
| `yarn test:web` | Run frontend tests |

### Code Quality

| Script | Description |
|---|---|
| `yarn lint` | Lint all workspaces |
| `yarn type-check` | TypeScript type-check all workspaces |

### Docker

| Script | Description |
|---|---|
| `yarn docker:dev:all` | Dev — all services |
| `yarn docker:dev:api` | Dev — databases + API |
| `yarn docker:dev:infra` | Dev — databases only |
| `yarn docker:prod` | Production — all services |
| `yarn docker:test` | Test — runs test suites in containers |

### Workspace Management

```bash
# Add a dependency to a specific app
yarn workspace @myapp/api add @nestjs/config
yarn workspace @myapp/web add zustand

# Add a shared dev tool to the root
yarn add -W eslint prettier

# Run a command in a specific workspace
yarn workspace @myapp/shared build
```