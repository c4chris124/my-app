import { CanActivate, Injectable, SetMetadata } from '@nestjs/common';

// stub — replace with real JWT guard later
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
