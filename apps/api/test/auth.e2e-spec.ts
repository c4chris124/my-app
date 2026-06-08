import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import type { AuthConfig } from './../src/config/auth.config';

/**
 * End-to-end auth flow against a live Postgres + Redis.
 *
 * Requires the dev infrastructure to be up and reachable on localhost:
 *   yarn docker:dev:infra   (postgres:5432, redis:6379)
 *   yarn workspace @myapp/api migration:run   (POSTGRES_HOST=localhost)
 *
 * Run with:  POSTGRES_HOST=localhost REDIS_URL=redis://localhost:6379 \
 *            yarn workspace @myapp/api test:e2e
 *
 * It replicates the main.ts bootstrap (cookie-parser + validation pipe + trust
 * proxy) since TestingModule does not run main.ts.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof app.getHttpServer>;

  // Unique per run so repeated runs don't collide on the email unique index.
  const email = `e2e+${Date.now()}@example.com`;
  const password = 'sup3r-secret-passphrase';

  let cookies: string[] = [];
  let csrfToken = '';

  beforeAll(async () => {
    // Default the DB/Redis hosts to localhost for a host-side test run.
    process.env.POSTGRES_HOST = process.env.POSTGRES_HOST ?? 'localhost';
    process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    const cfg = app.get(ConfigService);
    const auth = cfg.getOrThrow<AuthConfig>('auth');
    (app as NestExpressApplication).set('trust proxy', 1);
    app.use(cookieParser(auth.session.secret));
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  /** Pull the csrf cookie value out of a Set-Cookie array. */
  function extractCsrf(setCookie: string[]): string {
    const c = setCookie.find((s) => s.startsWith('csrf='));
    return c ? c.split(';')[0].slice('csrf='.length) : '';
  }

  it('registers a user and issues session + csrf cookies', async () => {
    const res = await request(http)
      .post('/auth/register')
      .send({ email, password, name: 'E2E User' })
      .expect(201);

    expect(res.body.user.email).toBe(email);
    expect(res.body.csrfToken).toEqual(expect.any(String));

    cookies = res.headers['set-cookie'] as unknown as string[];
    csrfToken = extractCsrf(cookies);
    expect(cookies.some((c) => c.startsWith('sid='))).toBe(true);
    expect(csrfToken).not.toBe('');
  });

  it('GET /auth/me resolves the session from the cookie', async () => {
    const res = await request(http)
      .get('/auth/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(res.body.user.email).toBe(email);
  });

  it('GET /auth/sessions lists the current session', async () => {
    const res = await request(http)
      .get('/auth/sessions')
      .set('Cookie', cookies)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].current).toBe(true);
  });

  it('rejects a mutating request without the CSRF header (403)', async () => {
    await request(http)
      .post('/auth/logout')
      .set('Cookie', cookies)
      .set('Origin', 'http://127.0.0.1')
      .set('Host', '127.0.0.1')
      .expect(403);
  });

  it('logs out with a valid CSRF header (204) and invalidates the session', async () => {
    await request(http)
      .post('/auth/logout')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .expect(204);

    await request(http).get('/auth/me').set('Cookie', cookies).expect(401);
  });

  it('rejects login with a wrong password (generic 401)', async () => {
    await request(http)
      .post('/auth/login')
      .send({ email, password: 'definitely-wrong' })
      .expect(401);
  });

  it('bumps session_version on global sign-out, invalidating old cookies', async () => {
    // Fresh login → new session.
    const login = await request(http)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const sessionCookies = login.headers['set-cookie'] as unknown as string[];
    const sessionCsrf = extractCsrf(sessionCookies);

    // Sign out everywhere.
    await request(http)
      .post('/auth/sessions/revoke-all')
      .set('Cookie', sessionCookies)
      .set('X-CSRF-Token', sessionCsrf)
      .expect(204);

    // The just-used cookie is now rejected by the version gate.
    await request(http)
      .get('/auth/me')
      .set('Cookie', sessionCookies)
      .expect(401);
  });
});
