import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import {
  CSRF_HEADER,
  IS_PUBLIC_KEY,
  REQ_SESSION,
  SKIP_CSRF_KEY,
} from '../auth.constants.js';
import { CookieService } from '../services/cookie.service.js';
import type { ActiveSession } from '../auth.types.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defense-in-depth for state-changing requests (ADR 0001, Decision B):
 *   1. same-origin check (Origin/Referer host must equal the request host), and
 *   2. double-submit token — the `X-CSRF-Token` header must equal both the
 *      `csrf` cookie and the server-side session token.
 * `SameSite=Lax` on the session cookie is the third, browser-enforced layer.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: CookieService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const opt = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (opt || isPublic) return true;

    this.assertSameOrigin(req);

    const session = (req as unknown as Record<string, unknown>)[REQ_SESSION] as
      | ActiveSession
      | undefined;
    if (!session) throw new ForbiddenException('No session for CSRF check');

    const header = req.headers[CSRF_HEADER];
    const headerToken = Array.isArray(header) ? header[0] : header;
    const cookieToken = this.readCsrfCookie(req);

    if (
      !headerToken ||
      !cookieToken ||
      !safeEqual(headerToken, cookieToken) ||
      !safeEqual(headerToken, session.csrf)
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }

  private readCsrfCookie(req: Request): string | undefined {
    const cookies = (req.cookies as Record<string, unknown>) ?? {};
    const value = cookies[this.cookies.csrfCookieName];
    return typeof value === 'string' ? value : undefined;
  }

  private assertSameOrigin(req: Request): void {
    const host = req.headers.host;
    const source = req.headers.origin || req.headers.referer;
    if (!source) return; // No Origin/Referer (e.g. same-origin GET-like) — rely on token.
    try {
      const url = new URL(source);
      if (url.host !== host) {
        throw new ForbiddenException('Cross-origin request rejected');
      }
    } catch {
      throw new ForbiddenException('Malformed Origin');
    }
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
