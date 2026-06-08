import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@myapp/shared';
import { ROLES_KEY } from '../auth.constants.js';

/** Require one of the given roles (enforced by `RolesGuard`). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
