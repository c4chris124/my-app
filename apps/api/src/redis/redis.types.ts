import type { Redis } from 'ioredis';

/**
 * ioredis client augmented with the registered session Lua commands. ioredis
 * adds a method per `defineCommand` call; we declare their signatures here so
 * the store can call them with full typing. Custom-command args are
 * `(...keys, ...argv)` flattened, all coerced to strings by ioredis.
 */
export interface SessionRedis extends Redis {
  /** KEYS: sess:{h}, usess:{userId}; ARGV: now, sessPexpire, idxPexpire, max, member, ...fields */
  createSession(...args: (string | number)[]): Promise<string[]>;
  /** KEYS: sess:{h}; ARGV: now, touchInterval, idlePexpire, idxPexpire, member, ip */
  validateAndTouch(...args: (string | number)[]): Promise<string[]>;
  /** KEYS: sess:{h}, usess:{userId}; ARGV: member */
  revokeOne(...args: (string | number)[]): Promise<number>;
  /** KEYS: usess:{userId}; ARGV: keepMember */
  revokeOthers(...args: (string | number)[]): Promise<string[]>;
  /** KEYS: usess:{userId} */
  revokeAll(...args: (string | number)[]): Promise<string[]>;
}
