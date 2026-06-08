import type { UserRole, UserStatus } from '../enums/auth.enums.js';

/**
 * The authenticated user as exposed to clients. This is the public projection
 * of the server-side principal — it never includes the password hash, session
 * id, or CSRF token.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  sessionVersion: number;
}

/**
 * Response body for `POST /auth/login`, `POST /auth/register`, and
 * `POST /auth/change-password`. The session itself rides in an HttpOnly cookie;
 * the CSRF token is returned for the double-submit header (it is also set as a
 * JS-readable cookie). There is deliberately NO bearer token.
 */
export interface LoginResponse {
  user: AuthUser;
  csrfToken: string;
}

/** Response body for `GET /auth/me`. */
export interface MeResponse {
  user: AuthUser;
  csrfToken: string;
}

/**
 * A single active session/device, as returned by `GET /auth/sessions`. `id` is
 * the opaque public handle used to revoke a specific session; the underlying
 * secret session id is never exposed.
 */
export interface SessionInfo {
  id: string;
  current: boolean;
  domain: string;
  ipCreated: string | null;
  ipLastSeen: string | null;
  deviceLabel: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
  absoluteExpiresAt: string;
}

/** Request body for `POST /auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Request body for `POST /auth/register`. */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/** Request body for `POST /auth/change-password`. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
