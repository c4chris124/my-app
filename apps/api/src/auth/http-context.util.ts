import type { Request } from 'express';
import type { RequestContext } from './services/session.service.js';

/** Extract client IP + User-Agent for session/audit context. */
export function requestContext(req: Request): RequestContext {
  // `app.set('trust proxy', 1)` makes req.ip honor the proxy chain.
  const ip = req.ip ?? req.socket?.remoteAddress ?? '';
  const userAgent =
    typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : '';
  return { ip, userAgent };
}
