import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { UserRole, UserStatus } from '@myapp/shared';
import { UsersService } from '../../users/users.service.js';
import { UserSession } from '../entities/user-session.entity.js';
import { SessionRevokeReason, AuthEventType } from '../entities/auth.enums.js';
import { RedisSessionStore } from './redis-session.store.js';
import { DeviceService } from './device.service.js';
import { AuthAuditService } from './auth-audit.service.js';
import type { User } from '../../users/entities/user.entity.js';
import type {
  ActiveSession,
  AuthPrincipal,
  SessionPayload,
  ValidationResult,
} from '../auth.types.js';

export interface RequestContext {
  ip: string;
  userAgent: string;
}

export interface EstablishedSession {
  rawSessionId: string;
  csrf: string;
  publicId: string;
  absExpAt: number;
  isNewDevice: boolean;
}

export interface SessionListItem {
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

/**
 * Bridges the authoritative Redis store and the durable Postgres mirror. Owns
 * session creation (incl. LRU-eviction bookkeeping + new-device detection),
 * the validate path with PG-backed version reconciliation, and all revocation
 * variants. Redis is authoritative for liveness; the `user_sessions` rows lag
 * and exist for the device API + forensics (ADR 0001, Decision A).
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly store: RedisSessionStore,
    private readonly users: UsersService,
    private readonly devices: DeviceService,
    private readonly audit: AuthAuditService,
    @InjectRepository(UserSession)
    private readonly sessions: Repository<UserSession>,
  ) {}

  /**
   * Create a session for a freshly-authenticated user (login or OAuth). Always
   * mints a brand-new opaque ID (session-fixation defense). Does NOT seed the
   * `uver` cache — login snapshots `session_version` from Postgres into the
   * payload, and the cache is populated lazily by `validate` from PG. This is
   * what makes a racing "sign out everywhere" win (ADR 0001, races).
   */
  async establish(
    user: User,
    ctx: RequestContext,
  ): Promise<EstablishedSession> {
    const device = this.devices.describe(ctx.userAgent);
    const csrf = RedisSessionStore.mintCsrf();
    const publicId = randomUUID();

    const created = await this.store.createSession({
      publicId,
      userId: user.id,
      sver: user.sessionVersion,
      role: user.role,
      status: user.status,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? '',
      domain: this.resolveDomain(user),
      ip: ctx.ip,
      userAgent: ctx.userAgent.slice(0, 512),
      deviceLabel: device.label,
      deviceHash: device.deviceHash,
      csrf,
    });

    // Durable mirror row (publicId == Redis payload `id`).
    await this.sessions.insert({
      id: publicId,
      sessionIdHash: created.sidHash,
      userId: user.id,
      sessionVersion: user.sessionVersion,
      domain: this.resolveDomain(user),
      ipCreated: ctx.ip || null,
      ipLastSeen: ctx.ip || null,
      userAgent: ctx.userAgent.slice(0, 512),
      deviceHash: device.deviceHash,
      deviceLabel: device.label,
      createdAt: new Date(created.createdAt),
      lastSeenAt: new Date(created.lastSeenAt),
      absoluteExpiresAt: new Date(created.absExpAt),
    });

    // Reflect LRU evictions in the durable mirror.
    if (created.evicted.length > 0) {
      await this.markRevokedByHash(
        created.evicted,
        SessionRevokeReason.LRU_EVICTED,
      );
    }

    const { isNew } = await this.devices.touchKnownDevice(user.id, device);
    if (isNew) {
      await this.audit.record(AuthEventType.NEW_DEVICE, {
        userId: user.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { deviceLabel: device.label },
      });
    }

    return {
      rawSessionId: created.rawSessionId,
      csrf,
      publicId,
      absExpAt: created.absExpAt,
      isNewDevice: isNew,
    };
  }

  /**
   * Validate the cookie's session and refresh it. Resolves a cold/missing
   * version cache by reloading the authoritative value from Postgres, then
   * re-running the Lua validation so the version gate is enforced against
   * fresh data. Returns the bound `ActiveSession` or null.
   */
  /** Validate from the raw cookie value (hashes, then delegates). */
  validateCookie(
    rawSessionId: string,
    ctx: RequestContext,
  ): Promise<{ session: ActiveSession; principal: AuthPrincipal } | null> {
    return this.validate(this.store.hashId(rawSessionId), ctx);
  }

  async validate(
    sidHash: string,
    ctx: RequestContext,
  ): Promise<{ session: ActiveSession; principal: AuthPrincipal } | null> {
    let result = await this.store.validateAndTouch(sidHash, ctx.ip);

    if (result.status === 'VERSION_UNKNOWN' && result.userId) {
      const reconciled = await this.reconcileVersion(result.userId);
      if (reconciled === null) {
        // User vanished/disabled — kill the session.
        await this.store.revokeOne(result.userId, sidHash);
        return null;
      }
      result = await this.store.validateAndTouch(sidHash, ctx.ip);
    }

    if (result.status !== 'VALID' || !result.payload) {
      if (result.status === 'EXPIRED' || result.status === 'REVOKED') {
        await this.markRevokedByHash(
          [sidHash],
          result.status === 'EXPIRED'
            ? SessionRevokeReason.EXPIRED
            : SessionRevokeReason.GLOBAL_SIGNOUT,
        );
      }
      return null;
    }

    return {
      session: this.toActiveSession(
        sidHash,
        result.payload,
        result.touched ?? false,
      ),
      principal: this.payloadToPrincipal(result.payload),
    };
  }

  /** Throttled write-back of last-seen to the Postgres mirror (interceptor). */
  async writeBackLastSeen(
    sidHash: string,
    lastSeenAt: number,
    ip: string,
  ): Promise<void> {
    try {
      await this.sessions.update(
        { sessionIdHash: sidHash, revokedAt: IsNull() },
        { lastSeenAt: new Date(lastSeenAt), ipLastSeen: ip || null },
      );
    } catch (err) {
      this.logger.warn(
        `last-seen write-back failed: ${(err as Error).message}`,
      );
    }
  }

  async list(
    userId: string,
    currentSidHash: string,
  ): Promise<SessionListItem[]> {
    const hashes = await this.store.listActiveHashes(userId);
    const items: SessionListItem[] = [];
    for (const h of hashes) {
      const p = await this.store.getByHash(h);
      if (!p) continue;
      items.push({
        id: p.id,
        current: h === currentSidHash,
        domain: p.domain,
        ipCreated: p.ipCreated || null,
        ipLastSeen: p.ipLast || null,
        deviceLabel: p.deviceLabel,
        userAgent: p.ua,
        createdAt: new Date(p.createdAt).toISOString(),
        lastSeenAt: new Date(p.lastSeenAt).toISOString(),
        absoluteExpiresAt: new Date(p.absExpAt).toISOString(),
      });
    }
    return items;
  }

  /** Revoke a specific session by its public handle. */
  async revokeByPublicId(
    userId: string,
    publicId: string,
    reason: SessionRevokeReason,
  ): Promise<boolean> {
    const row = await this.sessions.findOne({
      where: { id: publicId, userId, revokedAt: IsNull() },
    });
    if (!row) return false;
    await this.store.revokeOne(userId, row.sessionIdHash);
    await this.markRevokedByHash([row.sessionIdHash], reason);
    await this.audit.record(AuthEventType.SESSION_REVOKED, {
      userId,
      metadata: { sessionId: publicId, reason },
    });
    return true;
  }

  async revokeOthers(
    userId: string,
    keepSidHash: string,
    ctx: { ip?: string; userAgent?: string } = {},
  ): Promise<number> {
    const revoked = await this.store.revokeOthers(userId, keepSidHash);
    if (revoked.length > 0) {
      await this.markRevokedByHash(revoked, SessionRevokeReason.LOGOUT_OTHERS);
    }
    await this.audit.record(AuthEventType.SESSIONS_REVOKED_ALL, {
      userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { scope: 'others', count: revoked.length },
    });
    return revoked.length;
  }

  /** Revoke a single session (used by logout) without a version bump. */
  async revokeSelf(
    userId: string,
    sidHash: string,
    reason: SessionRevokeReason,
  ): Promise<void> {
    await this.store.revokeOne(userId, sidHash);
    await this.markRevokedByHash([sidHash], reason);
  }

  /**
   * "Sign out everywhere" / credential rotation. Bumps `session_version` in
   * Postgres (source of truth), invalidates the `uver` cache (cache-aside),
   * then revokes every live session. The version gate guarantees any session
   * the revoke missed is still rejected on its next request.
   */
  async globalSignOut(
    userId: string,
    opts: { passwordChanged?: boolean; reason: SessionRevokeReason },
    ctx: { ip?: string; userAgent?: string } = {},
  ): Promise<void> {
    await this.users.bumpSessionVersion(userId, {
      passwordChanged: opts.passwordChanged,
    });
    await this.store.invalidateUserVersion(userId);
    const revoked = await this.store.revokeAll(userId);
    if (revoked.length > 0) {
      await this.markRevokedByHash(revoked, opts.reason);
    }
    await this.audit.record(AuthEventType.GLOBAL_SIGNOUT, {
      userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: {
        passwordChanged: !!opts.passwordChanged,
        count: revoked.length,
      },
    });
  }

  // ── internals ──

  /**
   * Repopulate `uver` from Postgres. Returns the version, or null when the user
   * is gone or not in a sign-in-able state (disabled/locked).
   */
  private async reconcileVersion(userId: string): Promise<number | null> {
    const user = await this.users.findById(userId);
    if (!user || user.status !== UserStatus.ACTIVE) return null;
    await this.store.setUserVersion(userId, user.sessionVersion);
    return user.sessionVersion;
  }

  private async markRevokedByHash(
    sidHashes: string[],
    reason: SessionRevokeReason,
  ): Promise<void> {
    if (sidHashes.length === 0) return;
    try {
      await this.sessions.update(
        { sessionIdHash: In(sidHashes), revokedAt: IsNull() },
        { revokedAt: new Date(), revokeReason: reason },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to mark sessions revoked: ${(err as Error).message}`,
      );
    }
  }

  private payloadToPrincipal(p: SessionPayload): AuthPrincipal {
    return {
      id: p.userId,
      email: p.email,
      name: p.name,
      role: p.role as UserRole,
      status: p.status as UserStatus,
      avatarUrl: p.avatarUrl || null,
      sessionVersion: p.sver,
    };
  }

  private toActiveSession(
    sidHash: string,
    p: SessionPayload,
    touched: boolean,
  ): ActiveSession {
    return {
      publicId: p.id,
      sidHash,
      userId: p.userId,
      sessionVersion: p.sver,
      domain: p.domain,
      csrf: p.csrf,
      createdAt: p.createdAt,
      lastSeenAt: p.lastSeenAt,
      absExpAt: p.absExpAt,
      touched,
    };
  }

  /** CRM users land on the crm domain; everyone else on ecommerce. */
  private resolveDomain(user: User): string {
    return user.role === UserRole.ADMIN || user.role === UserRole.MANAGER
      ? 'crm'
      : 'ecommerce';
  }
}

/** Re-export for the interceptor's convenience. */
export type { ValidationResult };
