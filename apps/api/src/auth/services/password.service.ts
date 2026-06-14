import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import type { Algorithm } from '@node-rs/argon2';
import type { AuthConfig } from '../../config/auth.config.js';

/**
 * `Algorithm.Argon2id` numeric value. The enum is an ambient `const enum` which
 * `isolatedModules` forbids accessing by member, so we pin the value directly.
 */
const ARGON2ID = 2 as Algorithm;

/**
 * argon2id password hashing (`@node-rs/argon2` — prebuilt NAPI, no native
 * build-script dependency). An optional server-side pepper (`PASSWORD_PEPPER`)
 * is mixed in as the argon2 `secret`, so a database leak alone is insufficient
 * to mount an offline attack.
 */
@Injectable()
export class PasswordService {
  private readonly opts: {
    algorithm: Algorithm;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
    secret?: Buffer;
  };

  /** A throwaway hash for constant-time anti-enumeration on unknown users. */
  private dummyHash: string | null = null;

  constructor(private readonly config: ConfigService) {
    const auth = this.config.getOrThrow<AuthConfig>('auth');
    const pepper = auth.password.pepper;
    this.opts = {
      algorithm: ARGON2ID,
      memoryCost: auth.argon2.memoryCost,
      timeCost: auth.argon2.timeCost,
      parallelism: auth.argon2.parallelism,
      ...(pepper ? { secret: Buffer.from(pepper, 'utf8') } : {}),
    };
  }

  hash(plain: string): Promise<string> {
    return argonHash(plain, this.opts);
  }

  async verify(hashStr: string, plain: string): Promise<boolean> {
    try {
      return await argonVerify(hashStr, plain, this.opts);
    } catch {
      return false;
    }
  }

  /**
   * Run a verify against a dummy hash to equalize timing for non-existent users
   * (defeats account enumeration via response-time side channel).
   */
  async verifyDummy(plain: string): Promise<void> {
    if (!this.dummyHash) {
      this.dummyHash = await this.hash('dummy-anti-enumeration-password');
    }
    await this.verify(this.dummyHash, plain);
  }
}
