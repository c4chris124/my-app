import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../auth.constants.js';

/** Opt a route out of the global `SessionAuthGuard`. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
