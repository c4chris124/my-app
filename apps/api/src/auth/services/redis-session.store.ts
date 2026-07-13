import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'node:crypto';
import { REDIS_CLIENT, KEY } from '../../redis/redis.constants.js';
import type { SessionRedis } from '../../redis/redis.types.js';
import type { AuthConfig } from '../../config/auth.config.js';
import type {
  SessionPayload,
  ValidationResult,
  ValidationStatus,
} from '../auth.types.js';

export interface NewSessionSeed {
  publicId: string;
  userId: string;
  sver: number;
  role: string;
  status: string;
  email: string;
  name: string;
  avatarUrl: string;
  domain: string;
  ip: string;
  userAgent: string;
  deviceLabel: string;
  deviceHash: string;
  csrf: string;
}

export interface CreatedSession {
  rawSessionId: string;
  sidHash: string;
  createdAt: number;
  lastSeenAt: number;
  absExpAt: number;
  /** Member hashes LRU-evicted to honor the per-user cap. */
  evicted: string[];
}

/**
 * The opaque-ID lifecycle + Redis Lua bridge. The raw 256-bit session ID lives
 * only in the cookie; Redis is keyed by `sha256(rawId)` so a Redis dump yields
 * no usable cookies. All multi-step mutations delegate to the atomic Lua scripts
 * registered on the client.
 */
@Injectable()
export class RedisSessionStore {
  private readonly cfg: AuthConfig;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: SessionRedis,
    config: ConfigService,
  ) {
    this.cfg = config.getOrThrow<AuthConfig>('auth');
  }

  /** Generate a fresh opaque session ID (cookie value) + its Redis hash. */
  mintId(): { rawSessionId: string; sidHash: string } {
    const rawSessionId = randomBytes(32).toString('base64url');
    return { rawSessionId, sidHash: hashId(rawSessionId) };
  }

  /** Generate a 256-bit CSRF token (double-submit). */
  static mintCsrf(): string {
    return randomBytes(32).toString('base64url');
  }

  hashId(rawSessionId: string): string {
    return hashId(rawSessionId);
  }

  async createSession(seed: NewSessionSeed): Promise<CreatedSession> {
    const { rawSessionId, sidHash } = this.mintId();
    const now = Date.now();
    const absExpAt = now + this.cfg.session.absoluteTtlSeconds * 1000;
    const sessPexpire = Math.min(
      this.cfg.session.idleTtlSeconds * 1000,
      absExpAt - now,
    );
    const idxPexpire = this.cfg.session.absoluteTtlSeconds * 1000;

    const fields: (string | number)[] = [
      'id',
      seed.publicId,
      'userId',
      seed.userId,
      'sver',
      seed.sver,
      'role',
      seed.role,
      'status',
      seed.status,
      'email',
      seed.email,
      'name',
      seed.name,
      'avatarUrl',
      seed.avatarUrl,
      'domain',
      seed.domain,
      'ipCreated',
      seed.ip,
      'ipLast',
      seed.ip,
      'ua',
      seed.userAgent,
      'deviceLabel',
      seed.deviceLabel,
      'deviceHash',
      seed.deviceHash,
      'csrf',
      seed.csrf,
      'createdAt',
      now,
      'lastSeenAt',
      now,
      'absExpAt',
      absExpAt,
    ];

    const evicted = await this.redis.createSession(
      KEY.session(sidHash),
      KEY.userSessions(seed.userId),
      now,
      sessPexpire,
      idxPexpire,
      this.cfg.session.maxPerUser,
      sidHash,
      ...fields,
    );

    return {
      rawSessionId,
      sidHash,
      createdAt: now,
      lastSeenAt: now,
      absExpAt,
      evicted: evicted ?? [],
    };
  }

  async validateAndTouch(
    sidHash: string,
    currentIp: string,
  ): Promise<ValidationResult> {
    const now = Date.now();
    const raw = await this.redis.validateAndTouch(
      KEY.session(sidHash),
      now,
      this.cfg.session.touchIntervalSeconds * 1000,
      this.cfg.session.idleTtlSeconds * 1000,
      this.cfg.session.absoluteTtlSeconds * 1000,
      sidHash,
      currentIp ?? '',
    );

    const status = raw[0] as ValidationStatus;
    if (status === 'VERSION_UNKNOWN') {
      return { status, userId: raw[1], sver: Number(raw[2]) };
    }
    if (status !== 'VALID') {
      return { status };
    }
    const touched = raw[1] === '1';
    const payload = parsePayload(raw.slice(2));
    return { status, payload, touched };
  }

  async revokeOne(userId: string, sidHash: string): Promise<boolean> {
    const existed = await this.redis.revokeOne(
      KEY.session(sidHash),
      KEY.userSessions(userId),
      sidHash,
    );
    return existed === 1;
  }

  revokeOthers(userId: string, keepSidHash: string): Promise<string[]> {
    return this.redis.revokeOthers(KEY.userSessions(userId), keepSidHash);
  }

  revokeAll(userId: string): Promise<string[]> {
    return this.redis.revokeAll(KEY.userSessions(userId));
  }

  /** List active session member-hashes for a user, most-recent first. */
  async listActiveHashes(userId: string): Promise<string[]> {
    return this.redis.zrevrange(KEY.userSessions(userId), 0, -1);
  }

  /** Fetch a single session payload by its hash (null if gone). */
  async getByHash(sidHash: string): Promise<SessionPayload | null> {
    const flat = await this.redis.hgetall(KEY.session(sidHash));
    if (!flat || Object.keys(flat).length === 0) return null;
    const pairs: string[] = [];
    for (const [k, v] of Object.entries(flat)) pairs.push(k, v);
    return parsePayload(pairs);
  }

  // ── Version cache (uver:{userId}) ──

  async getUserVersion(userId: string): Promise<number | null> {
    const v = await this.redis.get(KEY.userVersion(userId));
    return v === null ? null : Number(v);
  }

  /** Cache the version. TTL matches the absolute window so it self-cleans. */
  async setUserVersion(userId: string, version: number): Promise<void> {
    await this.redis.set(
      KEY.userVersion(userId),
      version,
      'EX',
      this.cfg.session.absoluteTtlSeconds,
    );
  }

  /** Cache-aside invalidation — never stale-SET (ADR 0001). */
  async invalidateUserVersion(userId: string): Promise<void> {
    await this.redis.del(KEY.userVersion(userId));
  }
}

function hashId(rawSessionId: string): string {
  return createHash('sha256').update(rawSessionId).digest('hex');
}

/** Build a typed payload from a flat [k,v,k,v,...] array. */
function parsePayload(flat: string[]): SessionPayload {
  const h: Record<string, string> = {};
  for (let i = 0; i < flat.length; i += 2) {
    h[flat[i]] = flat[i + 1];
  }
  return {
    id: h.id,
    userId: h.userId,
    sver: Number(h.sver),
    role: h.role,
    status: h.status,
    email: h.email,
    name: h.name,
    avatarUrl: h.avatarUrl,
    domain: h.domain,
    ipCreated: h.ipCreated,
    ipLast: h.ipLast,
    ua: h.ua,
    deviceLabel: h.deviceLabel,
    deviceHash: h.deviceHash,
    csrf: h.csrf,
    createdAt: Number(h.createdAt),
    lastSeenAt: Number(h.lastSeenAt),
    absExpAt: Number(h.absExpAt),
  };
}
