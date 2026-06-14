import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, REQ_SESSION, REQ_USER } from '../auth.constants.js';
import { CookieService } from '../services/cookie.service.js';
import { SessionService } from '../services/session.service.js';
import { requestContext } from '../http-context.util.js';

/**
 * Global authentication gate. Resolves the signed session cookie against Redis
 * (with PG version reconciliation) and attaches the principal + live session to
 * the request. Routes opt out with `@Public()`.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: CookieService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const raw = this.cookies.readSessionCookie(req);
    if (!raw) throw new UnauthorizedException('Not authenticated');

    const resolved = await this.sessions.validateCookie(
      raw,
      requestContext(req),
    );
    if (!resolved) throw new UnauthorizedException('Session expired');

    (req as unknown as Record<string, unknown>)[REQ_USER] = resolved.principal;
    (req as unknown as Record<string, unknown>)[REQ_SESSION] = resolved.session;
    return true;
  }
}
