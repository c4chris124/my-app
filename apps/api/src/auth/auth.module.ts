import { Module, type Provider } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { UserSession } from './entities/user-session.entity.js';
import { UserKnownDevice } from './entities/user-known-device.entity.js';
import { AuthAuditEvent } from './entities/auth-audit-event.entity.js';
import { PasswordService } from './services/password.service.js';
import { CookieService } from './services/cookie.service.js';
import { AuthAuditService } from './services/auth-audit.service.js';
import { DeviceService } from './services/device.service.js';
import { RedisSessionStore } from './services/redis-session.store.js';
import { SessionService } from './services/session.service.js';
import { AuthService } from './services/auth.service.js';
import { OAuthService } from './oauth/oauth.service.js';
import { GoogleStrategy } from './oauth/google.strategy.js';
import { SessionAuthGuard } from './guards/session-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { CsrfGuard } from './guards/csrf.guard.js';
import { SessionWriteBackInterceptor } from './interceptors/session-write-back.interceptor.js';
import { AuthController } from './auth.controller.js';
import { SessionsController } from './sessions.controller.js';

/**
 * Google OAuth is wired only when enabled, so the app boots without Google
 * credentials. `passport-google-oauth20` throws in its constructor on a missing
 * clientID, so the strategy must be conditionally provided.
 */
const googleEnabled = ['1', 'true', 'yes', 'on'].includes(
  (process.env.GOOGLE_OAUTH_ENABLED ?? '').toLowerCase(),
);
const googleProviders: Provider[] = googleEnabled ? [GoogleStrategy] : [];

/**
 * Authentication module. Registers the global guard chain (auth → roles → CSRF)
 * and the session write-back interceptor as APP-level providers. RedisModule is
 * `@Global`, so `REDIS_CLIENT` is available to `RedisSessionStore` here.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([UserSession, UserKnownDevice, AuthAuditEvent]),
  ],
  controllers: [AuthController, SessionsController],
  providers: [
    PasswordService,
    CookieService,
    AuthAuditService,
    DeviceService,
    RedisSessionStore,
    SessionService,
    AuthService,
    OAuthService,
    ...googleProviders,
    // Order matters: auth sets the principal/session, roles & CSRF read it.
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_INTERCEPTOR, useClass: SessionWriteBackInterceptor },
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
