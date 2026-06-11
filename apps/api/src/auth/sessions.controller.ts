import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SessionService } from './services/session.service.js';
import { CookieService } from './services/cookie.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { CurrentSession } from './decorators/current-session.decorator.js';
import { SessionRevokeReason } from './entities/auth.enums.js';
import { requestContext } from './http-context.util.js';
import type { AuthPrincipal, ActiveSession } from './auth.types.js';

/**
 * Device / session management. All routes require an authenticated session
 * (global `SessionAuthGuard`) and mutating routes pass `CsrfGuard`.
 */
@ApiTags('auth')
@Controller('auth/sessions')
export class SessionsController {
  constructor(
    private readonly sessions: SessionService,
    private readonly cookies: CookieService,
  ) {}

  /** List the user's active sessions, current one flagged. */
  @Get()
  list(
    @CurrentUser() user: AuthPrincipal,
    @CurrentSession() session: ActiveSession,
  ) {
    return this.sessions.list(user.id, session.sidHash);
  }

  /** Revoke a specific session by its public id. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeOne(
    @CurrentUser() user: AuthPrincipal,
    @CurrentSession() session: ActiveSession,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const ok = await this.sessions.revokeByPublicId(
      user.id,
      id,
      SessionRevokeReason.USER_LOGOUT,
    );
    if (!ok) throw new NotFoundException('Session not found');
    // If the user revoked their own current session, clear cookies too.
    if (id === session.publicId) this.cookies.clearAuthCookies(res);
  }

  /** Revoke every other session, keeping the current device signed in. */
  @Post('revoke-others')
  @HttpCode(HttpStatus.OK)
  async revokeOthers(
    @CurrentUser() user: AuthPrincipal,
    @CurrentSession() session: ActiveSession,
    @Req() req: Request,
  ) {
    const count = await this.sessions.revokeOthers(
      user.id,
      session.sidHash,
      requestContext(req),
    );
    return { revoked: count };
  }

  /**
   * "Sign out everywhere" — global version bump; kills every session including
   * the current one, so we clear the local cookies as well.
   */
  @Post('revoke-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAll(
    @CurrentUser() user: AuthPrincipal,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.sessions.globalSignOut(
      user.id,
      { reason: SessionRevokeReason.GLOBAL_SIGNOUT },
      requestContext(req),
    );
    this.cookies.clearAuthCookies(res);
  }
}
