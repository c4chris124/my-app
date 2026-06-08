import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Triggers the Passport Google handshake. `session: false` — Passport is used
 * only to extract identity; no Passport session is created and no JWT is issued
 * (ADR 0002). The controller bridges the resolved identity into the normal
 * session-creation flow.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor() {
    super({ session: false });
  }
}
