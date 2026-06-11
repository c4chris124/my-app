import { registerAs } from '@nestjs/config';

export type CookieSameSite = 'lax' | 'strict' | 'none';

export interface AuthConfig {
  redis: { url: string };
  session: {
    cookieName: string;
    csrfCookieName: string;
    secret: string;
    idleTtlSeconds: number;
    absoluteTtlSeconds: number;
    maxPerUser: number;
    touchIntervalSeconds: number;
  };
  cookie: { secure: boolean; sameSite: CookieSameSite; domain?: string };
  argon2: { memoryCost: number; timeCost: number; parallelism: number };
  password: { pepper: string | null };
  google: {
    enabled: boolean;
    clientId: string | null;
    clientSecret: string | null;
    callbackUrl: string | null;
  };
  oauth: {
    stateTtlSeconds: number;
    successRedirect: string;
    failureRedirect: string;
    allowedReturnToPrefixes: string[];
  };
}

const isProd = process.env.NODE_ENV === 'production';

const toBool = (v: string | undefined, fallback: boolean): boolean =>
  v === undefined || v === ''
    ? fallback
    : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());

const toInt = (v: string | undefined, fallback: number): number => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

const toSameSite = (v: string | undefined): CookieSameSite =>
  v === 'strict' || v === 'none' ? v : 'lax';

/**
 * Typed `auth` configuration namespace.
 *
 * Wired into ConfigModule in step 5; the matching env template lives in the
 * monorepo-root `.env.example`. Secrets default to empty/null so the module
 * can be loaded; presence is enforced by env validation + AuthModule bootstrap.
 */
export default registerAs(
  'auth',
  (): AuthConfig => ({
    redis: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    session: {
      cookieName:
        process.env.SESSION_COOKIE_NAME || (isProd ? '__Host-sid' : 'sid'),
      csrfCookieName: process.env.CSRF_COOKIE_NAME || 'csrf',
      secret: process.env.SESSION_SECRET ?? '',
      idleTtlSeconds: toInt(process.env.SESSION_IDLE_TTL, 60 * 60 * 24 * 7), // 7d
      absoluteTtlSeconds: toInt(
        process.env.SESSION_ABSOLUTE_TTL,
        60 * 60 * 24 * 30, // 30d
      ),
      maxPerUser: toInt(process.env.SESSION_MAX_PER_USER, 10),
      touchIntervalSeconds: toInt(process.env.SESSION_TOUCH_INTERVAL, 60),
    },
    cookie: {
      secure: toBool(process.env.COOKIE_SECURE, isProd),
      sameSite: toSameSite(process.env.COOKIE_SAMESITE),
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    argon2: {
      memoryCost: toInt(process.env.ARGON2_MEMORY_COST, 19456), // 19 MiB (OWASP min)
      timeCost: toInt(process.env.ARGON2_TIME_COST, 2),
      parallelism: toInt(process.env.ARGON2_PARALLELISM, 1),
    },
    password: { pepper: process.env.PASSWORD_PEPPER || null },
    google: {
      enabled: toBool(process.env.GOOGLE_OAUTH_ENABLED, false),
      clientId: process.env.GOOGLE_CLIENT_ID || null,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || null,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || null,
    },
    oauth: {
      stateTtlSeconds: toInt(process.env.OAUTH_STATE_TTL, 300),
      successRedirect: process.env.OAUTH_SUCCESS_REDIRECT || '/',
      failureRedirect:
        process.env.OAUTH_FAILURE_REDIRECT || '/login?error=oauth',
      allowedReturnToPrefixes: (
        process.env.OAUTH_ALLOWED_RETURN_TO || '/,/crm,/ecommerce,/account'
      )
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    },
  }),
);
