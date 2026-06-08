/** DI token for the shared ioredis client (with registered Lua commands). */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Redis key prefixes. These MUST stay in lock-step with the literals hard-coded
 * inside the Lua scripts (`lua/session-scripts.ts`), which reconstruct sibling
 * keys (`sess:`, `usess:`) from the userId / member read out of a hash. Single
 * Redis node only — the Lua key construction is not Redis-Cluster safe.
 */
export const KEY = {
  /** `sess:{h}` — Hash, the authoritative session payload. */
  session: (h: string) => `sess:${h}`,
  /** `usess:{userId}` — Sorted Set, member=`{h}`, score=lastSeenAt(ms). */
  userSessions: (userId: string) => `usess:${userId}`,
  /** `uver:{userId}` — String(int), cache-aside copy of users.session_version. */
  userVersion: (userId: string) => `uver:${userId}`,
  /** `lf:ip:{ip}` — failed-login counter (sliding window). */
  loginFailIp: (ip: string) => `lf:ip:${ip}`,
  /** `lf:user:{emailHash}` — failed-login counter (sliding window). */
  loginFailUser: (emailHash: string) => `lf:user:${emailHash}`,
} as const;
