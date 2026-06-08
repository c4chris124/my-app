/** Why a session was terminated (audit + revoke bookkeeping). */
export enum SessionRevokeReason {
  USER_LOGOUT = 'user_logout',
  LOGOUT_OTHERS = 'logout_others',
  GLOBAL_SIGNOUT = 'global_signout',
  PASSWORD_CHANGE = 'password_change',
  ADMIN = 'admin',
  EXPIRED = 'expired',
  HIJACK = 'hijack',
  LRU_EVICTED = 'lru_evicted',
}

/**
 * Security event taxonomy stored in `auth_audit_events.event_type`.
 * Persisted as a plain string column (not a PG enum) so the taxonomy can grow
 * without a schema migration.
 */
export enum AuthEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  NEW_DEVICE = 'new_device',
  SESSION_REVOKED = 'session_revoked',
  SESSIONS_REVOKED_ALL = 'sessions_revoked_all',
  PASSWORD_CHANGED = 'password_changed',
  GLOBAL_SIGNOUT = 'global_signout',
  LOCKED_OUT = 'locked_out',
}
