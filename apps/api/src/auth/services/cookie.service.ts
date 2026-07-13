import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, CookieOptions } from 'express';
import type { AuthConfig } from '../../config/auth.config.js';

/**
 * Owns the session + CSRF cookies. The session cookie is `HttpOnly` and signed
 * with `SESSION_SECRET` (cheap pre-Redis tamper rejection + a rotation
 * kill-switch). The CSRF cookie is intentionally readable by JS for the
 * double-submit pattern. In prod the session cookie name uses the `__Host-`
 * prefix, which mandates `Secure`, `Path=/`, and no `Domain`.
 */
@Injectable()
export class CookieService {
  private readonly cfg: AuthConfig;

  constructor(private readonly config: ConfigService) {
    this.cfg = this.config.getOrThrow<AuthConfig>('auth');
  }

  get sessionCookieName(): string {
    return this.cfg.session.cookieName;
  }

  get csrfCookieName(): string {
    return this.cfg.session.csrfCookieName;
  }

  private baseOptions(): CookieOptions {
    const usingHostPrefix = this.cfg.session.cookieName.startsWith('__Host-');
    return {
      secure: this.cfg.cookie.secure,
      sameSite: this.cfg.cookie.sameSite,
      path: '/',
      // `__Host-` forbids Domain; otherwise honor the configured domain.
      ...(usingHostPrefix || !this.cfg.cookie.domain
        ? {}
        : { domain: this.cfg.cookie.domain }),
    };
  }

  /** Read the signed session cookie's raw value, or null if absent/tampered. */
  readSessionCookie(req: Request): string | null {
    const signed = (req.signedCookies as Record<string, unknown>) ?? {};
    const value = signed[this.sessionCookieName];
    return typeof value === 'string' ? value : null;
  }

  /** Set the session cookie (HttpOnly, signed) with the sliding idle Max-Age. */
  setSessionCookie(res: Response, rawSessionId: string): void {
    res.cookie(this.sessionCookieName, rawSessionId, {
      ...this.baseOptions(),
      httpOnly: true,
      signed: true,
      maxAge: this.cfg.session.idleTtlSeconds * 1000,
    });
  }

  /** Set the (JS-readable) double-submit CSRF cookie. */
  setCsrfCookie(res: Response, csrfToken: string): void {
    res.cookie(this.csrfCookieName, csrfToken, {
      ...this.baseOptions(),
      httpOnly: false,
      signed: false,
      maxAge: this.cfg.session.idleTtlSeconds * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    const opts = this.baseOptions();
    res.clearCookie(this.sessionCookieName, { ...opts, httpOnly: true });
    res.clearCookie(this.csrfCookieName, { ...opts, httpOnly: false });
  }
}
