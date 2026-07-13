# ADR 0001 — Stateful, Redis-Backed Session Authentication

- **Status:** Accepted
- **Date:** 2026-06-06
- **Deciders:** Backend / Security
- **Supersedes:** the interim localStorage bearer-token scheme in `apps/web/src/services/authStore.ts`
- **Related:** [ADR 0002 — Google OAuth Social Login](./0002-google-oauth-social-login.md)

## Context

`@myapp/api` (NestJS 11 + TypeORM + PostgreSQL) needs first-class authentication for two
storefronts (`ecommerce`, `crm`) with roles `customer | admin | manager`. The product
requirements are fundamentally about **server-side control of session lifecycle**:

- Instant remote revocation of a session.
- A live list of a user's devices/sessions (IP, User-Agent, last-seen).
- A concurrent-session cap per user.
- A single lever to "sign out everywhere" for credential rotation / hijack response.

Redis is already provisioned (`REDIS_URL`); the SPA is served same-origin via a `/api`
proxy (Vite in dev, Nginx in prod). The incumbent front-end stores a bearer token in
`localStorage`, which is XSS-exfiltratable and cannot be revoked server-side before expiry.

## Decision

Adopt **stateful sessions**:

- An **opaque 256-bit session ID** (CSPRNG), delivered in a **`HttpOnly; Secure; SameSite=Lax`
  cookie**. The cookie is the only place the raw ID ever lives.
- **Redis is the authoritative runtime store** for validation, sliding TTL, concurrency, and
  the version gate. The per-request hot path touches Redis only.
- **PostgreSQL is the durable system-of-record** for `users` (incl. the session-version
  columns) and a **session audit/history mirror** that survives Redis loss and powers
  admin/forensics.
- A **monotonic `users.session_version`** integer is the O(1) global-invalidation lever.

No JWTs are issued anywhere, including the OAuth path (see ADR 0002).

## Rationale — stateful sessions over stateless JWT

| Concern | Stateless JWT | Stateful Session (chosen) |
|---|---|---|
| Instant revocation | ✗ Valid until `exp`; needs a server-side denylist (→ stateful anyway) | ✓ `DEL` the key / bump version |
| "List my devices" | ✗ No record of issued tokens | ✓ Native per-user index |
| Concurrent-session cap | ✗ No issuance ledger | ✓ Atomic on the index |
| Global sign-out / rotation | ✗ Rotating the signing key logs out *everyone* | ✓ Bump one user's version |
| Per-request cost | No store lookup | One Redis O(1) read (sub-ms) |
| Theft blast radius | Full lifetime, offline-usable | Killable instantly; opaque, no PII |
| Payload | Claims readable client-side | Opaque 32 bytes; state stays server-side |

The sole JWT advantage (no per-request lookup) is moot: every requirement above needs a
server-side check regardless, and a Redis `HGETALL` is sub-millisecond. **Considered and
rejected:** a hybrid short-lived access JWT + Redis refresh — meets the requirements but adds
token-rotation machinery and a revocation-latency window for no benefit at this scale.

## Cookie & transport model

- **Value:** `base64url(32 random bytes)` — opaque, 256-bit, not a JWT.
- **At rest in Redis:** keyed by `sha256(rawId)`. A Redis dump therefore yields no usable
  cookies (pre-image resistance) — the same posture as storing API tokens hashed.
- **Attributes:** `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (prod), `Max-Age` = idle TTL.
  Prod cookie name uses the **`__Host-` prefix** (`__Host-sid`); dev uses `sid` (no `Secure`
  on http). `Lax` keeps top-level OAuth/email-link navigations working while blocking cross-site
  sub-resource CSRF.
- **Same-origin by design:** both Vite and Nginx proxy `/api` → API, so the browser sees one
  origin; cookies "just work" and CORS credentials are a fallback, not the primary path.
- **Optional HMAC envelope** over the cookie (server `SESSION_SECRET`) for cheap pre-Redis
  rejection of tampered values and a secret-rotation kill-switch.

## CSRF strategy (Decision B)

Defense-in-depth for state-changing requests: (1) `SameSite=Lax`, plus (2) **double-submit
token** — a non-`HttpOnly` `csrf` cookie + matching `X-CSRF-Token` header enforced by
`CsrfGuard` on all mutating verbs, plus (3) an **Origin/Referer** allow-list check.

## Session lifetime (Decision C)

- **Idle (sliding) TTL** — 7 days, refreshed on activity (Redis key TTL).
- **Absolute cap** — 30 days, stored in-payload, enforced regardless of activity.
- **Max concurrent sessions/user** — 10, LRU-evicted atomically at login.
- **Re-auth / step-up** for sensitive ops (change password, "revoke all", view sessions).

## Redis data model

`{h}` = `sha256(rawSessionId)`.

| Key | Type | Contents | TTL | Purpose |
|---|---|---|---|---|
| `sess:{h}` | Hash | `id`(publicId uuid), `userId`, `sver`, `role`, `domain`, `ipCreated`, `ipLast`, `ua`, `deviceLabel`, `deviceHash`, `createdAt`, `lastSeenAt`, `absExpAt`, `csrf` | idle TTL (≤ absExp) | The session payload; authoritative validation |
| `usess:{userId}` | Sorted Set | member=`{h}`, **score=`lastSeenAt`** (ms) | refreshed on write | List, `ZCARD` count, LRU-evict, revoke-others/all |
| `uver:{userId}` | String (int) | current `session_version` | cache-aside (invalidated on bump) | O(1) version gate without hitting Postgres |
| `lf:ip:{ip}` / `lf:user:{emailHash}` | String + TTL | failed-login counters | sliding window | Brute-force throttle / lockout |

**ZSET scored by `lastSeenAt`** gives recency-ordered device lists, `ZCARD` for the cap, and
LRU eviction. Absolute expiry is enforced by the hash TTL + lazy reconciliation (drop ZSET
members whose `sess:{h}` no longer exists) + a periodic reaper.

**Atomic operations run as Lua scripts** (single isolated execution — eliminates check-then-act
windows):

```
createSession      HSET payload; PEXPIRE min(idleTtl, absExp-now); ZADD usess now {h};
                   if ZCARD>max: evict LRU victims (DEL sess + ZREM); return victims
validateAndTouch   d=HGETALL; empty->NOT_FOUND; uver miss->VERSION_UNKNOWN (service reloads PG);
                   d.sver!=uver->DEL+ZREM+REVOKED; now>=absExp->DEL+ZREM+EXPIRED;
                   else throttled touch (HSET lastSeen, ZADD) + PEXPIRE; return d (VALID)
revokeOne          DEL sess:{h}; ZREM usess {h}
revokeOthers       for m in usess where m!=keep: DEL sess:{m}; ZREM
revokeAll          for m in usess: DEL sess:{m}; DEL usess
```

**Global sign-out / password change (service-level, ordered):** `UPDATE users SET
session_version+1, password_changed_at=now()` in a Postgres tx → `DEL uver:{userId}`
(cache-aside invalidate, never stale-`SET`) → `revokeAll` for immediate cleanup → audit. The
version gate guarantees any session `revokeAll` missed is still rejected.

## PostgreSQL schema (TypeORM)

Four tables (full entity definitions land in step 3). Columns are snake_case via a global
`SnakeNamingStrategy`; uuid PKs; `timestamptz`; named `idx_*`/`PK_*`/`FK_*`; Postgres enums.

- **`users`** — `id`, `email` (unique, lowercased), `password_hash` (nullable, `select:false`),
  `name`, `role` enum, `status` enum, **`session_version` int default 0**,
  **`password_changed_at`**, `email_verified_at`, `last_login_at`, timestamps.
  `google_id` and the nullable `password_hash` are introduced by ADR 0002.
- **`user_sessions`** — durable audit/history mirror. `id` (public handle exposed to the device
  API — never the secret), `session_id_hash` (unique, maps publicId↔Redis), `user_id` (FK),
  `session_version` (snapshot), `domain`, `ip_created`/`ip_last_seen` (`inet`), `user_agent`,
  `device_hash`, `device_label`, `created_at`, `last_seen_at` (throttled write-back),
  `absolute_expires_at`, `revoked_at`, `revoke_reason` enum. Partial index on
  `(user_id) WHERE revoked_at IS NULL`.
- **`user_known_devices`** — durable new-device detection (must survive Redis flush).
  `(user_id, device_hash)` unique, `first_seen_at`, `last_seen_at`, `trusted`.
- **`auth_audit_events`** — append-only security log: `event_type` enum, `user_id`, `ip`,
  `user_agent`, `metadata` jsonb (never raw IDs), `created_at`.

**Redis is authoritative for liveness**; Postgres lags slightly and is for audit/UX/forensics
and the publicId↔hash mapping used by revoke-by-id. This split is a deliberate trade-off
(Decision A — keep the durable mirror).

## Race conditions & atomicity

| Race | Risk | Mitigation |
|---|---|---|
| Concurrent login vs. max-session cap | Over-limit / wrong eviction | `createSession` Lua: add + `ZCARD` + LRU-evict atomically |
| TTL refresh vs. revoke/version-bump | Revoked session gets life extended | `validateAndTouch` Lua: version-compare **and** refresh atomically; mismatch → `DEL` in-script |
| "Sign out others" vs. in-flight login | New device wrongly killed/spared | "Others" iterate-deletes (no version bump); "Everywhere" bumps version |
| Index/payload drift | Phantom sessions in device list | LRU score on `lastSeen` + lazy reconciliation on read + periodic reaper |
| Version cache miss after Redis restart | Fail-open / thundering herd | Unknown version = "load from Postgres (source of truth) + repopulate", never "valid" |
| Session fixation | Pre-auth ID reused post-auth | Always mint a fresh ID at login; rotate on privilege elevation |

**Login vs. "sign out everywhere":** the global bump commits `session_version+1` to **Postgres
first**, then invalidates the Redis cache; login **snapshots `session_version` from Postgres**
(not the cache). So if the global sign-out wins the race, the just-minted session carries the
stale version and is rejected next request — correct for password-change/hijack. "Sign out
**others**" never bumps the version, so it cannot collateral-kill a concurrent legitimate login.

## Security hardening

argon2id (`@node-rs/argon2`, + optional pepper) · constant-time verify + dummy-hash
anti-enumeration · generic auth errors · Redis rate-limit + lockout · 256-bit CSPRNG opaque IDs
hashed at rest · `HttpOnly`+`Secure`+`SameSite`+`__Host-` · fixation rotation · idle **and**
absolute timeouts · CSRF (SameSite + double-submit + Origin) · step-up for sensitive ops ·
Helmet/HSTS/`trust proxy` · audit log + new-device alerts · `SESSION_SECRET` rotation as a
second kill-switch · never log raw IDs.

## NestJS architecture (summary)

- **Modules:** `RedisModule` (`@Global`, provides `REDIS_CLIENT` + Lua scripts + health),
  `UsersModule`, `AuthModule` (+ session/device/audit providers).
- **Controllers:** `AuthController` (`login`, `logout`, `me`, `csrf`, `change-password`,
  Google routes per ADR 0002), `SessionsController` (`GET /auth/sessions`,
  `DELETE /auth/sessions/:id`, `revoke-others`, `revoke-all`).
- **Services:** `AuthService`, `SessionService`, `RedisSessionStore`, `PasswordService`,
  `DeviceService`, `AuthAuditService`, `CookieService`, `OAuthService` (ADR 0002).
- **Guards:** `SessionAuthGuard` (global `APP_GUARD`, `@Public()` opt-out), `RolesGuard`
  (mirrors web `CRM_ROLES`), `CsrfGuard`, `ThrottlerGuard`, `GoogleAuthGuard` (ADR 0002).
- **Interceptor:** `SessionWriteBackInterceptor` (throttled last-seen write-back, sliding-cookie
  refresh).
- **Decorators:** `@Public()`, `@CurrentUser()`, `@CurrentSession()`, `@Roles()`.
- **`main.ts`:** `cookie-parser` (secret), `helmet`, `app.set('trust proxy', 1)`, Swagger
  `addCookieAuth`.

## Consequences

- **(+)** Instant revocation, device management, concurrency control, single-lever global
  logout, opaque XSS-resilient cookie, no PII in the token.
- **(−)** A Redis dependency on the hot path → requires Redis HA in prod; the Postgres mirror +
  version column are the durability backstop.
- **Naming strategy:** register a hand-rolled `SnakeNamingStrategy` globally (no external
  dependency — `typeorm-naming-strategies` peer-conflicts with this repo's `typeorm` pin). This
  also corrects the existing modules, whose camelCase entity properties currently map to
  snake_case migration columns with no strategy registered.
- **`typeorm` version:** `typeorm@1.0.0` is the installed major and post-dates the
  `typeorm-naming-strategies` package (which still peers `~0.3.0`) — that lag is exactly why the
  `SnakeNamingStrategy` is hand-rolled rather than imported. Step 3 verifies the TypeORM 1.0
  entity/migration API before writing entities.
- **Web client:** migrate off the localStorage bearer token to cookie + `GET /auth/me`; the
  `LoginResponse.token` field is removed.
- **Dependencies added:** `ioredis`, `cookie-parser`, `@node-rs/argon2`, `helmet`,
  `@nestjs/throttler`, `ua-parser-js`, `@nestjs/passport`, `passport`, `passport-google-oauth20`.

## Implementation plan

1. ADRs (this document + 0002). 2. Deps + `.env.example` + `authConfig` + env validation.
3. `SnakeNamingStrategy` + four entities + `CreateAuthSchema` migration. 4. `RedisModule`
(+ Lua), `UsersModule`, `AuthModule` (incl. Google OAuth). 5. Wire `main.ts`/`app.module.ts`
+ shared DTOs/interfaces. 6. Migrate the web client. 7. Tests (unit + e2e + MSW).
