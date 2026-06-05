FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY .yarnrc.yml yarn.lock ./
COPY .yarn ./.yarn
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN yarn install --immutable

FROM deps AS builder
# ★ Build-time env vars: VITE_* vars are baked into the bundle at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN yarn workspace @myapp/shared build
RUN yarn workspace @myapp/web build

# ★ ADVANCED CONCEPT: Swap Node.js for Nginx in production
# Build artifacts are static files — no Node.js needed to serve them.
# Nginx is far more efficient for static file serving and SPA routing.
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM deps AS development
ENV NODE_ENV=development
COPY tsconfig.base.json ./
WORKDIR /app/apps/web
# --host 0.0.0.0 is REQUIRED: Without it, Vite binds to the container's
# loopback interface (127.0.0.1), making it unreachable from the host.
CMD ["yarn", "dev", "--host", "0.0.0.0"]