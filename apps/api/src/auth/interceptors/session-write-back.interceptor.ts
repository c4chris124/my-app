import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { REQ_SESSION } from '../auth.constants.js';
import { CookieService } from '../services/cookie.service.js';
import { SessionService } from '../services/session.service.js';
import type { ActiveSession } from '../auth.types.js';

/**
 * After a request whose session was touched (Redis last-seen advanced past the
 * throttle window), mirror last-seen to Postgres and refresh the sliding
 * cookies' Max-Age so the browser-side lifetime tracks the Redis idle TTL. All
 * best-effort — never alters the response.
 */
@Injectable()
export class SessionWriteBackInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SessionWriteBackInterceptor.name);

  constructor(
    private readonly sessions: SessionService,
    private readonly cookies: CookieService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const session = (req as unknown as Record<string, unknown>)[
          REQ_SESSION
        ] as ActiveSession | undefined;
        if (!session || !session.touched) return;

        void this.sessions
          .writeBackLastSeen(session.sidHash, Date.now(), req.ip ?? '')
          .catch((err) =>
            this.logger.warn(`write-back failed: ${(err as Error).message}`),
          );

        // Refresh the sliding cookie (re-use the raw value already in the jar).
        const raw = this.cookies.readSessionCookie(req);
        if (raw && !res.headersSent) {
          this.cookies.setSessionCookie(res, raw);
          this.cookies.setCsrfCookie(res, session.csrf);
        }
      }),
    );
  }
}
