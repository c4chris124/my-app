/** Roles recognized across both storefronts. Mirrors the web auth store. */
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  MANAGER = 'manager',
}

/** Account lifecycle status. */
export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  LOCKED = 'locked',
}

/** Roles permitted into the CRM storefront. */
export const CRM_ROLES: ReadonlyArray<UserRole> = [
  UserRole.ADMIN,
  UserRole.MANAGER,
];
