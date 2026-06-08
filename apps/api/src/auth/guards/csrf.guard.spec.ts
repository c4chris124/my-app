import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard.js';
import { REQ_SESSION } from '../auth.constants.js';
import type { CookieService } from '../services/cookie.service.js';

const TOKEN = 'csrf-token-abc';

interface FakeReq {
  method: string;
  headers: Record<string, string | undefined>;
  cookies?: Record<string, string>;
  [REQ_SESSION]?: { csrf: string };
}

function contextFor(req: FakeReq): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeGuard(skip = false): CsrfGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(skip),
  } as unknown as Reflector;
  const cookies = { csrfCookieName: 'csrf' } as unknown as CookieService;
  return new CsrfGuard(reflector, cookies);
}

/** A request that passes every check (same-origin + matching triple). */
function validRequest(): FakeReq {
  return {
    method: 'POST',
    headers: {
      host: 'app.example',
      origin: 'https://app.example',
      'x-csrf-token': TOKEN,
    },
    cookies: { csrf: TOKEN },
    [REQ_SESSION]: { csrf: TOKEN },
  };
}

describe('CsrfGuard', () => {
  it('allows safe methods without any token', () => {
    const guard = makeGuard();
    const ctx = contextFor({ method: 'GET', headers: {} });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows mutating requests with a matching token triple + same origin', () => {
    const guard = makeGuard();
    expect(guard.canActivate(contextFor(validRequest()))).toBe(true);
  });

  it('rejects when the header token does not match the cookie', () => {
    const guard = makeGuard();
    const req = validRequest();
    req.headers['x-csrf-token'] = 'different';
    expect(() => guard.canActivate(contextFor(req))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects when the header is missing', () => {
    const guard = makeGuard();
    const req = validRequest();
    delete req.headers['x-csrf-token'];
    expect(() => guard.canActivate(contextFor(req))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a cross-origin request even with a valid token', () => {
    const guard = makeGuard();
    const req = validRequest();
    req.headers.origin = 'https://evil.example';
    expect(() => guard.canActivate(contextFor(req))).toThrow(
      ForbiddenException,
    );
  });

  it('skips enforcement when @SkipCsrf/@Public metadata is set', () => {
    const guard = makeGuard(true);
    const req = validRequest();
    delete req.headers['x-csrf-token'];
    expect(guard.canActivate(contextFor(req))).toBe(true);
  });
});
