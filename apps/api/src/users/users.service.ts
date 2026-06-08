import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole, UserStatus } from '@myapp/shared';
import { User } from './entities/user.entity.js';

/** Normalize emails to a single canonical form for lookup + storage. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface CreateLocalUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRole;
}

export interface CreateGoogleUserInput {
  email: string;
  googleId: string;
  name: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
}

/**
 * Persistence + lifecycle helpers for `users`. The auth flows depend on this
 * service for credential lookup (password hash is `select:false` and must be
 * opted into explicitly), JIT provisioning, account linking, and the
 * session-version bump that powers global sign-out.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: normalizeEmail(email) } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.users.findOne({ where: { googleId } });
  }

  /** Loads a user including the normally-hidden `passwordHash` for verification. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: normalizeEmail(email) })
      .getOne();
  }

  /** As above, by id (for the change-password re-verification step). */
  findByIdWithPassword(id: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  async createLocal(input: CreateLocalUserInput): Promise<User> {
    const user = this.users.create({
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role ?? UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    return this.users.save(user);
  }

  /** JIT-provision a social-only account (no password). */
  async createFromGoogle(input: CreateGoogleUserInput): Promise<User> {
    const user = this.users.create({
      email: normalizeEmail(input.email),
      googleId: input.googleId,
      name: input.name,
      avatarUrl: input.avatarUrl ?? null,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: input.emailVerified ? new Date() : null,
    });
    return this.users.save(user);
  }

  /**
   * Account linking: attach a Google identity to an existing (email/password)
   * user. `emailVerifiedAt` is set only when Google asserts the email is
   * verified and it wasn't already recorded.
   */
  async linkGoogle(
    userId: string,
    googleId: string,
    opts: { avatarUrl?: string | null; emailVerified: boolean },
  ): Promise<void> {
    const patch: Partial<User> = { googleId };
    if (opts.avatarUrl) patch.avatarUrl = opts.avatarUrl;
    if (opts.emailVerified) patch.emailVerifiedAt = new Date();
    await this.users.update({ id: userId }, patch);
  }

  async markLogin(userId: string): Promise<void> {
    await this.users.update({ id: userId }, { lastLoginAt: new Date() });
  }

  /**
   * Global-invalidation lever. Atomically bumps `session_version` (and, for a
   * password change, stamps `password_changed_at`) and returns the NEW version
   * so the caller can repopulate the `uver` cache and run `revokeAll`. Postgres
   * is committed first — login snapshots the version from PG, so a racing
   * sign-out always wins (ADR 0001, "Race conditions").
   */
  async bumpSessionVersion(
    userId: string,
    opts: { passwordChanged?: boolean } = {},
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      const qb = repo
        .createQueryBuilder()
        .update(User)
        .set(
          opts.passwordChanged
            ? {
                sessionVersion: () => 'session_version + 1',
                passwordChangedAt: () => 'now()',
              }
            : { sessionVersion: () => 'session_version + 1' },
        )
        .where('id = :userId', { userId })
        .returning('session_version');
      const result = await qb.execute();
      const raw = result.raw as Array<{ session_version: number }>;
      return raw[0]?.session_version ?? 0;
    });
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.users.update({ id: userId }, { passwordHash });
  }
}
