import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@myapp/shared';
import { UsersService, normalizeEmail } from '../../users/users.service.js';
import { PasswordService } from './password.service.js';
import { SessionService, type RequestContext } from './session.service.js';
import { AuthAuditService } from './auth-audit.service.js';
import { AuthEventType, SessionRevokeReason } from '../entities/auth.enums.js';
import type { User } from '../../users/entities/user.entity.js';
import type { AuthPrincipal, ActiveSession } from '../auth.types.js';
import type { LoginDto } from '../dto/login.dto.js';
import type { RegisterDto } from '../dto/register.dto.js';

export interface AuthResult {
  user: AuthPrincipal;
  session: {
    rawSessionId: string;
    csrf: string;
    publicId: string;
  };
}

/**
 * Top-level credential flows. Delegates session lifecycle to `SessionService`
 * and never issues a JWT. Login is hardened against account enumeration
 * (constant-time dummy verify) and emits generic errors.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly audit: AuthAuditService,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      // Generic to avoid confirming which emails are registered.
      throw new ConflictException('Unable to register with those details');
    }
    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.users.createLocal({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });
    return this.completeLogin(user, ctx);
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);

    // Equalize timing + reject uniformly when there's no usable credential.
    if (!user || !user.passwordHash) {
      await this.passwords.verifyDummy(dto.password);
      await this.audit.record(AuthEventType.LOGIN_FAILED, {
        userId: user?.id ?? null,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { email: normalizeEmail(dto.email), reason: 'no_credential' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await this.passwords.verify(user.passwordHash, dto.password);
    if (!ok) {
      await this.audit.record(AuthEventType.LOGIN_FAILED, {
        userId: user.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { reason: 'bad_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertSignInable(user);
    return this.completeLogin(user, ctx);
  }

  /** Shared tail for register/login/OAuth: establish session + audit + stamp. */
  async completeLogin(user: User, ctx: RequestContext): Promise<AuthResult> {
    const established = await this.sessions.establish(user, ctx);
    await this.users.markLogin(user.id);
    await this.audit.record(AuthEventType.LOGIN_SUCCESS, {
      userId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { newDevice: established.isNewDevice },
    });
    return {
      user: this.toPrincipal(user),
      session: {
        rawSessionId: established.rawSessionId,
        csrf: established.csrf,
        publicId: established.publicId,
      },
    };
  }

  async logout(session: ActiveSession): Promise<void> {
    await this.sessions.revokeSelf(
      session.userId,
      session.sidHash,
      SessionRevokeReason.USER_LOGOUT,
    );
  }

  /**
   * Change password: verify current, rehash, then global sign-out (bumps
   * `session_version`, invalidates cache, revokes all) so every other session
   * dies immediately. The caller re-establishes a fresh session afterward.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ctx: RequestContext,
  ): Promise<AuthResult> {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) throw new UnauthorizedException();
    if (!user.passwordHash) {
      // Social-only account setting a password for the first time would use a
      // different flow; here we require an existing password.
      throw new ForbiddenException('No password set for this account');
    }
    const ok = await this.passwords.verify(user.passwordHash, currentPassword);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const newHash = await this.passwords.hash(newPassword);
    await this.users.setPasswordHash(userId, newHash);
    await this.sessions.globalSignOut(
      userId,
      { passwordChanged: true, reason: SessionRevokeReason.PASSWORD_CHANGE },
      ctx,
    );
    await this.audit.record(AuthEventType.PASSWORD_CHANGED, {
      userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    // Re-establish a fresh session for the current device (the old one was
    // revoked by the version bump). `findById` reflects the bumped version.
    const refreshed = await this.users.findById(userId);
    if (!refreshed) throw new UnauthorizedException();
    return this.completeLogin(refreshed, ctx);
  }

  async getPrincipal(userId: string): Promise<AuthPrincipal | null> {
    const user = await this.users.findById(userId);
    return user ? this.toPrincipal(user) : null;
  }

  private assertSignInable(user: User): void {
    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('Account locked');
    }
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('Account disabled');
    }
  }

  toPrincipal(user: User): AuthPrincipal {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      sessionVersion: user.sessionVersion,
    };
  }
}
