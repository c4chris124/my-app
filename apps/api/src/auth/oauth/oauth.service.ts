import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@myapp/shared';
import { UsersService } from '../../users/users.service.js';
import type { AuthConfig } from '../../config/auth.config.js';
import type { User } from '../../users/entities/user.entity.js';
import type { GoogleIdentity } from './google.types.js';

/**
 * Resolves a verified Google identity to a local `User` via JIT provisioning
 * and account linking (ADR 0002). No JWT is involved — the caller bridges the
 * returned user into the standard session flow.
 */
@Injectable()
export class OAuthService {
  private readonly cfg: AuthConfig;

  constructor(
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    this.cfg = config.getOrThrow<AuthConfig>('auth');
  }

  get enabled(): boolean {
    return this.cfg.google.enabled;
  }

  /**
   * Resolution order: (1) existing googleId → that account; (2) same verified
   * email → LINK Google to it; (3) otherwise JIT-create a social-only account.
   *
   * Security: linking to a pre-existing email/password account is only done
   * when Google asserts the email is verified — otherwise an attacker who
   * controls an unverified Google profile could hijack the account.
   */
  async resolveGoogleUser(identity: GoogleIdentity): Promise<User> {
    const byGoogle = await this.users.findByGoogleId(identity.googleId);
    if (byGoogle) {
      this.assertActive(byGoogle);
      return byGoogle;
    }

    if (!identity.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    const byEmail = await this.users.findByEmail(identity.email);
    if (byEmail) {
      if (!identity.emailVerified) {
        throw new ForbiddenException(
          'Email already registered; sign in with your password to link Google',
        );
      }
      this.assertActive(byEmail);
      await this.users.linkGoogle(byEmail.id, identity.googleId, {
        avatarUrl: identity.avatarUrl,
        emailVerified: identity.emailVerified && !byEmail.emailVerifiedAt,
      });
      const linked = await this.users.findById(byEmail.id);
      return linked ?? byEmail;
    }

    return this.users.createFromGoogle({
      email: identity.email,
      googleId: identity.googleId,
      name: identity.name,
      avatarUrl: identity.avatarUrl,
      emailVerified: identity.emailVerified,
    });
  }

  /** Open-redirect guard for the post-login `returnTo`. */
  sanitizeReturnTo(returnTo: string | undefined): string {
    const fallback = this.cfg.oauth.successRedirect;
    if (!returnTo) return fallback;
    // Must be a same-site absolute path (no scheme, no protocol-relative).
    if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return fallback;
    const allowed = this.cfg.oauth.allowedReturnToPrefixes.some(
      (prefix) => returnTo === prefix || returnTo.startsWith(prefix),
    );
    return allowed ? returnTo : fallback;
  }

  private assertActive(user: User): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }
  }
}
