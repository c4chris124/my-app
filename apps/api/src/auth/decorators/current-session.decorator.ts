import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { REQ_SESSION } from '../auth.constants.js';
import type { ActiveSession, AuthenticatedRequest } from '../auth.types.js';

/** Injects the live `ActiveSession` bound to the request. */
export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActiveSession => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req[REQ_SESSION];
  },
);
