import type { Request } from 'express';
import type { UserRole, UserStatus } from '@myapp/shared';

/** The authenticated principal attached to the request after guard success. */
export interface AuthPrincipal {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  sessionVersion: number;
}

/**
 * The live session bound to the current request. `sidHash` and `csrf` never
 * leave the server boundary except as the CSRF cookie/header pair.
 */
export interface ActiveSession {
  /** Public, opaque handle (uuid) used by the device-management API. */
  publicId: string;
  /** sha256(rawSessionId) — the Redis/Postgres link. */
  sidHash: string;
  userId: string;
  sessionVersion: number;
  domain: string;
  csrf: string;
  createdAt: number;
  lastSeenAt: number;
  absExpAt: number;
  /** True when validateAndTouch refreshed last-seen this request. */
  touched: boolean;
}

/** Parsed `sess:{h}` Redis hash payload. */
export interface SessionPayload {
  id: string;
  userId: string;
  sver: number;
  role: string;
  status: string;
  email: string;
  name: string;
  avatarUrl: string;
  domain: string;
  ipCreated: string;
  ipLast: string;
  ua: string;
  deviceLabel: string;
  deviceHash: string;
  csrf: string;
  createdAt: number;
  lastSeenAt: number;
  absExpAt: number;
}

export type ValidationStatus =
  | 'VALID'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'REVOKED'
  | 'VERSION_UNKNOWN';

export interface ValidationResult {
  status: ValidationStatus;
  payload?: SessionPayload;
  touched?: boolean;
  /** Present for VERSION_UNKNOWN so the caller can reload from Postgres. */
  userId?: string;
  sver?: number;
}

/** Express request after `SessionAuthGuard` has authenticated it. */
export interface AuthenticatedRequest extends Request {
  authUser: AuthPrincipal;
  authSession: ActiveSession;
}
