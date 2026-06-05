# ★ ADVANCED CONCEPT: Multi-stage Builds
# Each FROM starts a new stage. Stages share nothing by default.
# COPY --from=<stage> pulls only what's needed into later stages.

# ─── Stage 1: Base ───────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ─── Stage 2: Dependencies ───────────────────────────────────
FROM base AS deps
# ★ ADVANCED CONCEPT: Docker Layer Caching (DLC)
# Copy dependency manifests FIRST, install, THEN copy source.
# yarn install only re-runs when package.json files change — not
# on every source code change. Wrong order = slow rebuilds.
COPY .yarnrc.yml yarn.lock ./
COPY .yarn ./.yarn
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN yarn install --immutable

# ─── Stage 3: Builder ────────────────────────────────────────
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN yarn workspace @myapp/shared build
RUN yarn workspace @myapp/api build

# ─── Stage 4: Production ─────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]

# ─── Stage 5: Development ────────────────────────────────────
# Source files come via bind mount, NOT COPY — see Section 8
FROM deps AS development
ENV NODE_ENV=development
COPY tsconfig.base.json ./
WORKDIR /app/apps/api
CMD ["yarn", "start:dev"]