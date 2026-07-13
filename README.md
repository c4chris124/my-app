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
- [API Documentation](#api-documentation)
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

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Package Manager | Yarn v4 (Berry) with Workspaces      |
| Backend         | NestJS                               |
| Frontend        | React + Vite                         |
| Shared Code     | TypeScript (interfaces, DTOs, utils) |
| Database        | PostgreSQL                           |
| Cache           | Redis                                |
| Infrastructure  | Docker + Docker Compose              |

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

| Service          | URL                   |
| ---------------- | --------------------- |
| Frontend (Vite)  | http://localhost:5173 |
| Backend (NestJS) | http://localhost:3000 |
| PostgreSQL       | localhost:5432        |
| Redis            | localhost:6379        |

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
import { UserDto, ApiResponse } from "@myapp/shared";
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

| Variable            | Description                                      | Default                 |
| ------------------- | ------------------------------------------------ | ----------------------- |
| `POSTGRES_DB`       | Database name                                    | `appdb`                 |
| `POSTGRES_USER`     | Database user                                    | `appuser`               |
| `POSTGRES_PASSWORD` | Database password                                | —                       |
| `JWT_SECRET`        | Secret for JWT signing                           | —                       |
| `NODE_ENV`          | Runtime environment                              | `development`           |
| `VITE_API_URL`      | API base URL (baked into frontend at build time) | `http://localhost:3000` |

> **Note:** `VITE_*` variables are embedded into the frontend bundle at **build time**. Changing them requires a rebuild — they are not read at runtime like NestJS environment variables.

---

## API Documentation

Base URL: `http://localhost:3000` (dev) — all endpoints are prefixed with the resource path shown below.

Interactive Swagger UI is available at `http://localhost:3000/api/docs` when the server is running.

### Products — `/products`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | Paginated product list with filters |
| `GET` | `/products/:id` | Find product by UUID |
| `GET` | `/products/sku/:sku` | Find product by SKU |
| `POST` | `/products` | Create a product |
| `PATCH` | `/products/:id` | Update a product |
| `DELETE` | `/products/:id` | Soft-delete a product (204) |

**Query parameters for `GET /products`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |
| `categoryId` | UUID | Filter by category |
| `brandId` | UUID | Filter by brand |
| `supplierId` | UUID | Filter by supplier |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `search` | string | Full-text search (name, SKU) |
| `tag` | string | Filter by tag (e.g. `clearance`) |
| `isFeatured` | boolean | Filter featured products |
| `isActive` | boolean | Filter active/inactive (default: `true`) |

**`POST /products` body:**

| Field | Required | Description |
|-------|----------|-------------|
| `sku` | yes | Unique SKU (max 100 chars) |
| `brandCode` | yes | Brand-internal code (max 150 chars) |
| `name` | yes | Product name (max 500 chars) |
| `brandId` | yes | UUID of the brand |
| `supplierId` | yes | UUID of the supplier |
| `categoryId` | yes | UUID of the category |
| `description` | no | Long description |
| `capacityValue` | no | Numeric capacity (e.g. `30`) |
| `capacityUnitId` | no | UUID of the capacity unit |
| `distributorPrice` | no | Cost price |
| `salePrice` | no | Selling price |
| `marginPercent` | no | Margin % |
| `salesWeighting` | no | `LOW \| MEDIUM \| HIGH \| VERY_HIGH` |
| `pricePending` | no | Flag price as pending (default: `false`) |
| `isFeatured` | no | Mark as featured (default: `false`) |
| `imageUrls` | no | Array of image URLs |
| `tags` | no | Array of string tags |
| `alternateCodes` | no | Array of alternate SKUs / barcodes |

---

### Categories — `/categories`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/categories` | Full category tree with nested subcategories |
| `GET` | `/categories/:slug/products` | Paginated products under a category slug (includes subcategories). Accepts the same query params as `GET /products`. |

---

### Brands — `/brands`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/brands` | List all active brands |
| `GET` | `/brands/:slug/products` | Paginated products for a brand slug. Accepts the same query params as `GET /products`. |

---

### Pricing — `/pricing`

#### Price calculation

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/pricing/calculate` | Calculate final price(s) for cart items |
| `POST` | `/pricing/validate-code` | Validate a promo code against cart context |

**`POST /pricing/calculate` body:**

```json
{
  "items": [
    { "productId": "<uuid>", "quantity": 2 }
  ],
  "promoCode": "SPRING26",
  "customerId": "<uuid>"
}
```

Response is an array of `PriceBreakdown` objects:

```json
[
  {
    "productId": "<uuid>",
    "sku": "RHB-00001",
    "basePrice": 5592.00,
    "priceAfterRules": 5145.00,
    "priceAfterPromo": 4630.50,
    "totalSavings": 961.50,
    "isFreeDelivery": false,
    "appliedRules": [
      { "ruleId": "<uuid>", "name": "Trade Tier", "discountType": "PERCENTAGE", "discountValue": 8, "amountSaved": 447.00 }
    ],
    "appliedPromoCode": {
      "code": "SPRING26", "description": "Spring campaign", "discountType": "PERCENTAGE",
      "discountValue": 10, "amountSaved": 514.50
    }
  }
]
```

**`POST /pricing/validate-code` body:**

```json
{ "code": "SPRING26", "cartContext": { ... } }
```

Response: `{ "valid": true }` or `{ "valid": false, "error": "Promo code expired" }`

#### Price rules management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pricing/rules` | List all price rules |
| `POST` | `/pricing/rules` | Create a price rule |
| `PATCH` | `/pricing/rules/:id` | Update a price rule |
| `DELETE` | `/pricing/rules/:id` | Deactivate a price rule (204) |

**`POST /pricing/rules` body:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Rule name (max 150 chars) |
| `ruleType` | yes | `CUSTOMER_TIER \| VOLUME \| PROMOTIONAL \| CLEARANCE` |
| `scope` | yes | `ALL \| CATEGORY \| BRAND \| PRODUCT` |
| `discountType` | yes | `PERCENTAGE \| FIXED_AMOUNT` |
| `discountValue` | yes | Discount amount / percentage |
| `description` | no | Description |
| `scopeCategoryId` | no | UUID — required when `scope = CATEGORY` |
| `scopeBrandId` | no | UUID — required when `scope = BRAND` |
| `scopeProductId` | no | UUID — required when `scope = PRODUCT` |
| `minQuantity` | no | Minimum quantity to trigger (default: 1) |
| `minOrderValue` | no | Minimum order value to trigger |
| `priority` | no | Rule evaluation order (default: 0, higher wins) |
| `isStackable` | no | Allow stacking with other rules (default: `false`) |
| `validFrom` | no | ISO 8601 date — rule start date |
| `validUntil` | no | ISO 8601 date — rule expiry date |

#### Promo codes management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pricing/promo-codes` | List all promo codes |
| `POST` | `/pricing/promo-codes` | Create a promo code |
| `PATCH` | `/pricing/promo-codes/:id` | Update a promo code |
| `DELETE` | `/pricing/promo-codes/:id` | Deactivate a promo code (204) |

**`POST /pricing/promo-codes` body:**

| Field | Required | Description |
|-------|----------|-------------|
| `code` | yes | Promo code string (max 50 chars, e.g. `SPRING26`) |
| `description` | yes | Human-readable description (max 500 chars) |
| `discountType` | yes | `PERCENTAGE \| FIXED_AMOUNT \| FREE_DELIVERY` |
| `applyScope` | yes | `CART \| PRODUCT \| CATEGORY` |
| `discountValue` | no | Discount amount / percentage (not needed for `FREE_DELIVERY`) |
| `scopeProductId` | no | UUID — required when `applyScope = PRODUCT` |
| `scopeCategoryId` | no | UUID — required when `applyScope = CATEGORY` |
| `minQuantity` | no | Minimum quantity (default: 1) |
| `minOrderValue` | no | Minimum cart value |
| `maxUsesTotal` | no | Global usage cap |
| `maxUsesPerCustomer` | no | Per-customer usage cap (default: 1) |
| `validFrom` | no | ISO 8601 start date |
| `validUntil` | no | ISO 8601 expiry date |

---

## Scripts Reference

All scripts are run from the **monorepo root**.

### Development

| Script         | Description                |
| -------------- | -------------------------- |
| `yarn dev:api` | Start NestJS in watch mode |
| `yarn dev:web` | Start Vite dev server      |
| `yarn dev:all` | Start both concurrently    |

### Build

| Script           | Description                              |
| ---------------- | ---------------------------------------- |
| `yarn build:api` | Build NestJS for production              |
| `yarn build:web` | Build Vite for production                |
| `yarn build:all` | Build all workspaces in dependency order |

### Testing

| Script          | Description        |
| --------------- | ------------------ |
| `yarn test:api` | Run API unit tests |
| `yarn test:web` | Run frontend tests |

### Code Quality

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `yarn lint`       | Lint all workspaces                  |
| `yarn type-check` | TypeScript type-check all workspaces |

### Docker

| Script                  | Description                           |
| ----------------------- | ------------------------------------- |
| `yarn docker:dev:all`   | Dev — all services                    |
| `yarn docker:dev:api`   | Dev — databases + API                 |
| `yarn docker:dev:infra` | Dev — databases only                  |
| `yarn docker:prod`      | Production — all services             |
| `yarn docker:test`      | Test — runs test suites in containers |

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
