import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';
import type { AuthConfig } from '../../config/auth.config.js';
import type { GoogleIdentity } from './google.types.js';

/**
 * Passport is used ONLY for the Google handshake/identity extraction
 * (`session: false`) — no Passport session, no JWT. `validate` hands a plain
 * `GoogleIdentity` to the guard, and the controller bridges it into the normal
 * session-creation flow (ADR 0002). Registered only when `GOOGLE_OAUTH_ENABLED`.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const auth = config.getOrThrow<AuthConfig>('auth');
    super({
      clientID: auth.google.clientId ?? '',
      clientSecret: auth.google.clientSecret ?? '',
      callbackURL: auth.google.callbackUrl ?? '',
      scope: ['email', 'profile'],
      // We carry our own signed-cookie state; passport's session is disabled.
      passReqToCallback: false,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const primaryEmail = profile.emails?.[0];
    const json = profile._json as { email_verified?: boolean } | undefined;
    const emailVerified =
      json?.email_verified === true ||
      (primaryEmail as { verified?: boolean } | undefined)?.verified === true;

    const identity: GoogleIdentity = {
      googleId: profile.id,
      email: primaryEmail?.value?.toLowerCase() ?? null,
      emailVerified,
      name: profile.displayName || primaryEmail?.value || 'Google User',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
    done(null, identity);
  }
}
