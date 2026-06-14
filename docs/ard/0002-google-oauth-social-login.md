# ADR 0002 — Google OAuth 2.0 Social Login (bridged into stateful sessions)

- **Status:** Accepted
- **Date:** 2026-06-06
- **Deciders:** Backend / Security
- **Depends on:** [ADR 0001 — Stateful, Redis-Backed Session Authentication](./0001-session-based-authentication.md)

## Context

We want "Sign in with Google" without compromising the session model in ADR 0001. The naive
OAuth integration issues a JWT from the callback — that would reintroduce an unrevocable bearer
token and split the auth model. We need social login to be **just another way to authenticate
into the exact same Redis-backed session**.

## Decision

Use **`@nestjs/passport` + `passport-google-oauth20` strictly for the OAuth handshake and
identity extraction**. Passport does **not** issue a token and we do **not** use its session
serialization (`session: false`). On a successful callback the controller invokes the **same
`SessionService.createSession` path as ADR 0001 Flow 1** — mint opaque 256-bit ID →
`createSession` Lua → device tracking → `Set-Cookie`. **No JWT is issued.**

## User entity changes

```text
password_hash : varchar(255) → NULLABLE, select:false      (social-only accounts)
google_id     : varchar(255) NULLABLE, sparse-unique        (Google subject id)
avatar_url    : varchar(500) NULLABLE                        (Google picture)

-- integrity: every account keeps at least one credential
CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
CREATE UNIQUE INDEX idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;
```

`googleId` is kept as a column on `users` per the current single-provider requirement. The
scalable shape for >1 provider is a separate `user_identities(user_id, provider,
provider_user_id)` table — documented as the migration path, not built now.

**Password-path cleanliness:** `PasswordService.verify` short-circuits to a constant-time
failure when `password_hash IS NULL`, so a social-only account hitting `/auth/login` returns the
standard generic `401` (no enumeration). `change-password` becomes a "set-password" flow for
accounts with no hash.

## End-to-end flow

1. **SPA → initiate.** The Google button is a **full-page navigation** (not XHR) to
   `GET /api/auth/google?domain=crm&returnTo=/crm/dashboard`.
2. **Guard builds anti-CSRF state.** `GoogleAuthGuard.canActivate` generates a CSPRNG `nonce`,
   signs `state = HMAC({nonce, domain, returnTo(validated), exp})`, sets a short-lived (5 min)
   `oauth_state` cookie (`HttpOnly; SameSite=Lax`) with the same blob, then Passport
   **302 → Google** with `state`, `scope=email profile`, `prompt=select_account`.
3. **Google authenticates** and **302 → `GOOGLE_CALLBACK_URL`** (routed through the SPA origin so
   the session cookie is set same-origin).
4. **Callback exchange.** `GoogleAuthGuard` (Passport) swaps `code` for tokens server-to-server,
   fetches the profile; `GoogleStrategy.validate` normalizes it → `req.user =
   { googleId, email, emailVerified, name, avatarUrl }`. `session:false`.
5. **Controller `googleCallback`:**
   - Validate `state` against the `oauth_state` cookie (HMAC + expiry + nonce). Mismatch →
     clear cookie, `302 → /login?error=oauth_state`.
   - **Require `emailVerified === true`** (else `302 → ?error=email_unverified`).
   - `OAuthService.resolveGoogleUser()` — JIT-provision or link (matrix below) in a Postgres
     transaction; unique constraints + retry handle the concurrent-first-login race.
   - Role↔domain check (a JIT `customer` requesting `crm` → `?error=forbidden_domain`).
   - **Session bridge = ADR 0001 Flow 1 steps 5–8** verbatim: opaque ID, snapshot
     `session_version` from Postgres, `createSession` Lua (+ LRU evict), insert `user_sessions`,
     device tracking + new-device email, audit `login_success{method:'google'}`, `Set-Cookie`.
   - Clear `oauth_state`; **302 → validated internal `returnTo`** (allow-list; default `/`). The
     SPA then calls `GET /auth/me` to hydrate. **No token in the URL, no JWT.**

**Open-redirect defense:** `returnTo` must be a relative path matching
`OAUTH_ALLOWED_RETURN_TO`; absolute URLs and `//` are rejected.

## Account-linking security (JIT provisioning)

| Existing account state | Resolution | Rationale |
|---|---|---|
| Found by `google_id` | Use it (fast path) | Already linked |
| Email match, `email_verified_at` set | **Link** `google_id`, proceed | Ownership already proven |
| Email match, **not** verified | **Link** `google_id` **and set `email_verified_at = now()`** | Google proves mailbox control → the verified party is the legitimate owner; resolves a pre-registered unverified squatter |
| No match | **JIT-provision** (`role=customer`, `password_hash=null`, `email_verified_at=now()`, `status=active`) | First-time social signup |

Residual risk (a squatter pre-creates an unverified password account on a victim's email) is
mitigated because pre-verification accounts hold no trusted data, and is fully eliminable via the
optional `OAUTH_REQUIRE_LINK_CONFIRMATION` toggle (require the existing password or an emailed
confirm before linking). **Default = trust Google's `email_verified` assertion.**

## NestJS additions

| Component | File | Detail |
|---|---|---|
| `GoogleStrategy` | `auth/strategies/google.strategy.ts` | `PassportStrategy(Strategy,'google')`; ctor from `authConfig.google`; `validate()` returns the normalized identity only |
| `GoogleAuthGuard` | `auth/guards/google-auth.guard.ts` | `extends AuthGuard('google')`; sets/signs `oauth_state` on initiate; injects `state`/`scope`/`prompt`; `session:false` |
| `OAuthService` | `auth/services/oauth.service.ts` | `resolveGoogleUser()` (JIT + linking, transactional) → delegates to `SessionService.createSession` |
| Routes | `auth.controller.ts` | `@Public() @UseGuards(GoogleAuthGuard) GET /auth/google` and `GET /auth/google/callback` |
| Module | `auth.module.ts` | `PassportModule.register({ session:false })`; boot guard: if `GOOGLE_OAUTH_ENABLED` and creds missing → throw |
| Config | `config/auth.config.ts` | `google{enabled,clientId,clientSecret,callbackUrl}`, `oauth{stateTtl,successRedirect,failureRedirect,allowedReturnToPrefixes}` |

## Consequences

- **(+)** One unified, fully-revocable session model for both password and Google logins; no
  bearer tokens; social accounts get the same device list / concurrency / global-logout behavior.
- **(−)** OAuth requires the real backend + Google credentials (it is not exercised under the
  web app's MSW mock dev mode, since the initiate route is a document navigation, not XHR).
- **Callback URL is environment-coupled** and must be registered in Google Console, routed
  through the SPA origin: dev `http://localhost:5173/api/auth/google/callback`, prod
  `https://app.example.com/api/auth/google/callback`.
- **Web client:** add a "Sign in with Google" button (full-page navigation) and an
  `?error=` handler on the login route.
