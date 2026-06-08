import { Repository } from 'typeorm';
import { SessionService } from './session.service.js';
import { RedisSessionStore } from './redis-session.store.js';
import { DeviceService } from './device.service.js';
import { AuthAuditService } from './auth-audit.service.js';
import { SessionRevokeReason } from '../entities/auth.enums.js';
import type { UsersService } from '../../users/users.service.js';
import type { UserSession } from '../entities/user-session.entity.js';

function deps() {
  const store = {
    createSession: jest.fn(),
    revokeOne: jest.fn(),
    revokeOthers: jest.fn(),
    revokeAll: jest.fn(),
    invalidateUserVersion: jest.fn(),
    setUserVersion: jest.fn(),
  } as unknown as jest.Mocked<RedisSessionStore>;

  const users = {
    bumpSessionVersion: jest.fn(),
    findById: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  const devices = {
    describe: jest
      .fn()
      .mockReturnValue({ deviceHash: 'dh', label: 'Chrome on Linux' }),
    touchKnownDevice: jest.fn().mockResolvedValue({ isNew: false }),
  } as unknown as jest.Mocked<DeviceService>;

  const audit = {
    record: jest.fn(),
  } as unknown as jest.Mocked<AuthAuditService>;

  const sessions = {
    insert: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<UserSession>>;

  const svc = new SessionService(store, users, devices, audit, sessions);
  return { svc, store, users, devices, audit, sessions };
}

describe('SessionService.globalSignOut', () => {
  it('bumps PG version, then invalidates the cache, then revokes all (ordered)', async () => {
    const { svc, store, users, sessions } = deps();
    const order: string[] = [];
    (users.bumpSessionVersion as jest.Mock).mockImplementation(async () => {
      order.push('bump');
      return 1;
    });
    (store.invalidateUserVersion as jest.Mock).mockImplementation(async () => {
      order.push('invalidate');
    });
    (store.revokeAll as jest.Mock).mockImplementation(async () => {
      order.push('revokeAll');
      return ['h1', 'h2'];
    });
    (sessions.update as jest.Mock).mockResolvedValue({});

    await svc.globalSignOut('u1', {
      reason: SessionRevokeReason.GLOBAL_SIGNOUT,
      passwordChanged: true,
    });

    expect(order).toEqual(['bump', 'invalidate', 'revokeAll']);
    expect(users.bumpSessionVersion).toHaveBeenCalledWith('u1', {
      passwordChanged: true,
    });
    // The two revoked hashes are reflected in the durable mirror.
    expect(sessions.update).toHaveBeenCalledTimes(1);
  });
});

describe('SessionService.revokeByPublicId', () => {
  it('maps the public id to its hash and revokes it', async () => {
    const { svc, store, sessions } = deps();
    (sessions.findOne as jest.Mock).mockResolvedValue({
      id: 'pub-1',
      sessionIdHash: 'hash-1',
      userId: 'u1',
    });
    (store.revokeOne as jest.Mock).mockResolvedValue(true);
    (sessions.update as jest.Mock).mockResolvedValue({});

    const ok = await svc.revokeByPublicId(
      'u1',
      'pub-1',
      SessionRevokeReason.USER_LOGOUT,
    );

    expect(ok).toBe(true);
    expect(store.revokeOne).toHaveBeenCalledWith('u1', 'hash-1');
  });

  it('returns false and does not touch Redis when the session is unknown', async () => {
    const { svc, store, sessions } = deps();
    (sessions.findOne as jest.Mock).mockResolvedValue(null);

    const ok = await svc.revokeByPublicId(
      'u1',
      'missing',
      SessionRevokeReason.USER_LOGOUT,
    );

    expect(ok).toBe(false);
    expect(store.revokeOne).not.toHaveBeenCalled();
  });
});

describe('SessionService.revokeOthers', () => {
  it('returns the count and keeps the current session', async () => {
    const { svc, store, sessions } = deps();
    (store.revokeOthers as jest.Mock).mockResolvedValue(['h2', 'h3']);
    (sessions.update as jest.Mock).mockResolvedValue({});

    const count = await svc.revokeOthers('u1', 'keep-hash');

    expect(count).toBe(2);
    expect(store.revokeOthers).toHaveBeenCalledWith('u1', 'keep-hash');
  });
});

describe('SessionService.establish', () => {
  it('marks LRU-evicted sessions revoked in the durable mirror', async () => {
    const { svc, store, sessions } = deps();
    (store.createSession as jest.Mock).mockResolvedValue({
      rawSessionId: 'raw',
      sidHash: 'newhash',
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      absExpAt: Date.now() + 1000,
      evicted: ['old-hash'],
    });
    (sessions.insert as jest.Mock).mockResolvedValue({});
    (sessions.update as jest.Mock).mockResolvedValue({});

    const user = {
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      role: 'customer',
      status: 'active',
      avatarUrl: null,
      sessionVersion: 0,
    } as never;

    const result = await svc.establish(user, {
      ip: '1.2.3.4',
      userAgent: 'UA',
    });

    expect(result.rawSessionId).toBe('raw');
    // insert (the new row) + update (mark the evicted one) both happen.
    expect(sessions.insert).toHaveBeenCalledTimes(1);
    expect(sessions.update).toHaveBeenCalled();
  });
});
