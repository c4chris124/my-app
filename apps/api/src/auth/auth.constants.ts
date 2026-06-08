/** Reflector metadata keys. */
export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ROLES_KEY = 'auth:roles';
export const SKIP_CSRF_KEY = 'auth:skipCsrf';

/** Request properties populated by `SessionAuthGuard`. */
export const REQ_USER = 'authUser';
export const REQ_SESSION = 'authSession';

/** Header carrying the double-submit CSRF token. */
export const CSRF_HEADER = 'x-csrf-token';
