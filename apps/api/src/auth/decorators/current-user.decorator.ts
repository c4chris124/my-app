import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { REQ_USER } from '../auth.constants.js';
import type { AuthPrincipal, AuthenticatedRequest } from '../auth.types.js';

/** Injects the authenticated `AuthPrincipal` (set by `SessionAuthGuard`). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req[REQ_USER];
  },
);
