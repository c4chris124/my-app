import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService, type AuthResult } from './services/auth.service.js';
import { OAuthService } from './oauth/oauth.service.js';
import { CookieService } from './services/cookie.service.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { Public } from './decorators/public.decorator.js';
import { SkipCsrf } from './decorators/skip-csrf.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { CurrentSession } from './decorators/current-session.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { requestContext } from './http-context.util.js';
import type { AuthConfig } from '../config/auth.config.js';
import type { AuthPrincipal, ActiveSession } from './auth.types.js';
import type { GoogleIdentity } from './oauth/google.types.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly oauth: OAuthService,
    private readonly cookies: CookieService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @SkipCsrf()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto, requestContext(req));
    return this.issue(res, result);
  }

  @Public()
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, requestContext(req));
    return this.issue(res, result);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @CurrentSession() session: ActiveSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(session);
    this.cookies.clearAuthCookies(res);
  }

  @Get('me')
  me(
    @CurrentUser() user: AuthPrincipal,
    @CurrentSession() session: ActiveSession,
  ) {
    return { user, csrfToken: session.csrf };
  }

  /** Re-issues the CSRF cookie from the live session (SPA bootstrap). */
  @Get('csrf')
  csrf(
    @CurrentSession() session: ActiveSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookies.setCsrfCookie(res, session.csrf);
    return { csrfToken: session.csrf };
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthPrincipal,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
      requestContext(req),
    );
    return this.issue(res, result);
  }

  // ── Google OAuth (ADR 0002) ──

  /** Kicks off the Google handshake (redirect handled by the guard). */
  @Public()
  @SkipCsrf()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleStart(): void {
    // Intentionally empty — GoogleAuthGuard issues the redirect to Google.
  }

  /**
   * OAuth callback: Passport has placed the resolved `GoogleIdentity` on
   * req.user. We bridge it into the standard session flow (NO JWT) and redirect
   * back to the SPA.
   */
  @Public()
  @SkipCsrf()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const auth = this.config.getOrThrow<AuthConfig>('auth');
    const identity = req.user as GoogleIdentity | undefined;
    if (!identity) {
      res.redirect(auth.oauth.failureRedirect);
      return;
    }
    try {
      const user = await this.oauth.resolveGoogleUser(identity);
      const result = await this.auth.completeLogin(user, requestContext(req));
      this.cookies.setSessionCookie(res, result.session.rawSessionId);
      this.cookies.setCsrfCookie(res, result.session.csrf);
      const returnTo = this.oauth.sanitizeReturnTo(
        typeof req.query.state === 'string' ? req.query.state : undefined,
      );
      res.redirect(returnTo);
    } catch {
      res.redirect(auth.oauth.failureRedirect);
    }
  }

  /** Set auth cookies from a login/register result and return the body. */
  private issue(res: Response, result: AuthResult) {
    this.cookies.setSessionCookie(res, result.session.rawSessionId);
    this.cookies.setCsrfCookie(res, result.session.csrf);
    return { user: result.user, csrfToken: result.session.csrf };
  }
}
