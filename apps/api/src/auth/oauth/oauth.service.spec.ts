import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus, UserRole } from '@myapp/shared';
import { OAuthService } from './oauth.service.js';
import type { UsersService } from '../../users/users.service.js';
import type { User } from '../../users/entities/user.entity.js';
import type { GoogleIdentity } from './google.types.js';
import type { AuthConfig } from '../../config/auth.config.js';

function makeConfig(): ConfigService {
  const auth = {
    google: { enabled: true },
    oauth: {
      successRedirect: '/',
      // Note: '/' is intentionally NOT whitelisted here so the fallback path is
      // exercised; the real default config does include '/', which (being
      // same-site) is a safe catch-all, not an open redirect.
      allowedReturnToPrefixes: ['/crm', '/account'],
    },
  } as unknown as AuthConfig;
  return { getOrThrow: () => auth } as unknown as ConfigService;
}

function makeUser(over: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'jane@example.com',
    name: 'Jane',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    googleId: null,
    avatarUrl: null,
    emailVerifiedAt: null,
    sessionVersion: 0,
    ...over,
  } as User;
}

function identity(over: Partial<GoogleIdentity> = {}): GoogleIdentity {
  return {
    googleId: 'g-123',
    email: 'jane@example.com',
    emailVerified: true,
    name: 'Jane',
    avatarUrl: null,
    ...over,
  };
}

describe('OAuthService.resolveGoogleUser', () => {
  let users: jest.Mocked<
    Pick<
      UsersService,
      | 'findByGoogleId'
      | 'findByEmail'
      | 'findById'
      | 'linkGoogle'
      | 'createFromGoogle'
    >
  >;
  let svc: OAuthService;

  beforeEach(() => {
    users = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      linkGoogle: jest.fn(),
      createFromGoogle: jest.fn(),
    } as never;
    svc = new OAuthService(users as unknown as UsersService, makeConfig());
  });

  it('returns the existing account matched by googleId', async () => {
    const existing = makeUser({ googleId: 'g-123' });
    users.findByGoogleId.mockResolvedValue(existing);
    await expect(svc.resolveGoogleUser(identity())).resolves.toBe(existing);
    expect(users.createFromGoogle).not.toHaveBeenCalled();
    expect(users.linkGoogle).not.toHaveBeenCalled();
  });

  it('links Google to an existing email account when the email is verified', async () => {
    const existing = makeUser({ id: 'u9', googleId: null });
    users.findByGoogleId.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(existing);
    users.findById.mockResolvedValue({
      ...existing,
      googleId: 'g-123',
    } as User);

    const result = await svc.resolveGoogleUser(
      identity({ emailVerified: true }),
    );

    expect(users.linkGoogle).toHaveBeenCalledWith(
      'u9',
      'g-123',
      expect.objectContaining({ emailVerified: true }),
    );
    expect(result.googleId).toBe('g-123');
    expect(users.createFromGoogle).not.toHaveBeenCalled();
  });

  it('refuses to link when Google has NOT verified the email (anti-takeover)', async () => {
    users.findByGoogleId.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(makeUser());
    await expect(
      svc.resolveGoogleUser(identity({ emailVerified: false })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.linkGoogle).not.toHaveBeenCalled();
  });

  it('JIT-provisions a new social-only account for an unknown email', async () => {
    users.findByGoogleId.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(null);
    const created = makeUser({ id: 'u-new', googleId: 'g-123' });
    users.createFromGoogle.mockResolvedValue(created);

    await expect(svc.resolveGoogleUser(identity())).resolves.toBe(created);
    expect(users.createFromGoogle).toHaveBeenCalledWith(
      expect.objectContaining({ googleId: 'g-123', email: 'jane@example.com' }),
    );
  });

  it('rejects a disabled account', async () => {
    users.findByGoogleId.mockResolvedValue(
      makeUser({ googleId: 'g-123', status: UserStatus.DISABLED }),
    );
    await expect(svc.resolveGoogleUser(identity())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('OAuthService.sanitizeReturnTo', () => {
  const svc = new OAuthService({} as unknown as UsersService, makeConfig());

  it('allows whitelisted same-site paths', () => {
    expect(svc.sanitizeReturnTo('/crm/dashboard')).toBe('/crm/dashboard');
  });

  it('falls back for absolute URLs and protocol-relative paths', () => {
    expect(svc.sanitizeReturnTo('https://evil.example/phish')).toBe('/');
    expect(svc.sanitizeReturnTo('//evil.example')).toBe('/');
  });

  it('falls back for non-whitelisted paths and undefined', () => {
    expect(svc.sanitizeReturnTo('/secret-admin')).toBe('/');
    expect(svc.sanitizeReturnTo(undefined)).toBe('/');
  });
});
