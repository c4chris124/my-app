import { SetMetadata } from '@nestjs/common';
import { SKIP_CSRF_KEY } from '../auth.constants.js';

/**
 * Opt a mutating route out of `CsrfGuard` (e.g. login, where no session/CSRF
 * cookie exists yet and `SameSite=Lax` + Origin checks are the defense).
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
