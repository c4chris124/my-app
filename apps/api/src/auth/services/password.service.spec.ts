import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service.js';
import type { AuthConfig } from '../../config/auth.config.js';

/** Minimal auth config with cheap argon2 params for fast tests. */
function makeConfig(pepper: string | null = null): ConfigService {
  const auth = {
    argon2: { memoryCost: 8, timeCost: 1, parallelism: 1 },
    password: { pepper },
  } as unknown as AuthConfig;
  return { getOrThrow: () => auth } as unknown as ConfigService;
}

describe('PasswordService', () => {
  it('hashes and verifies a correct password', async () => {
    const svc = new PasswordService(makeConfig());
    const hash = await svc.hash('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(
      svc.verify(hash, 'correct horse battery staple'),
    ).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const svc = new PasswordService(makeConfig());
    const hash = await svc.hash('right-password');
    await expect(svc.verify(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('returns false (never throws) on a malformed hash', async () => {
    const svc = new PasswordService(makeConfig());
    await expect(svc.verify('not-a-valid-hash', 'whatever')).resolves.toBe(
      false,
    );
  });

  it('binds the pepper: a hash made with a pepper fails to verify without it', async () => {
    const peppered = new PasswordService(makeConfig('s3rv3r-p3pp3r'));
    const plain = new PasswordService(makeConfig(null));
    const hash = await peppered.hash('same-password');
    await expect(peppered.verify(hash, 'same-password')).resolves.toBe(true);
    await expect(plain.verify(hash, 'same-password')).resolves.toBe(false);
  });

  it('verifyDummy resolves without throwing (anti-enumeration timing)', async () => {
    const svc = new PasswordService(makeConfig());
    await expect(svc.verifyDummy('anything')).resolves.toBeUndefined();
  });
});
