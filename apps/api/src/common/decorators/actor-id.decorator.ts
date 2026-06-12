import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request } from 'express';

// TODO: read both ids from the JWT subject once session auth is wired into
// carts/orders; the headers below are a temporary stand-in for the principal.

/** The authenticated customer's id (required). Stub: `x-customer-id` header. */
export const CustomerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const customerId = request.headers['x-customer-id'];
    if (typeof customerId !== 'string' || !isUUID(customerId)) {
      throw new BadRequestException(
        'x-customer-id header must be a valid UUID',
      );
    }
    return customerId;
  },
);

/** The acting staff user's id (optional). Stub: `x-user-id` header. */
export const ActorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const actorId = request.headers['x-user-id'];
    if (actorId === undefined) return undefined;
    if (typeof actorId !== 'string' || !isUUID(actorId)) {
      throw new BadRequestException('x-user-id header must be a valid UUID');
    }
    return actorId;
  },
);
