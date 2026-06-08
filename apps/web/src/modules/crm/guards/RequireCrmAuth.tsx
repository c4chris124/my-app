import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CRM_ROLES, useAuthStore } from "../../../services/authStore";
import { FullPageSpinner } from "../../../components/FullPageSpinner";

/**
 * Gates the CRM's protected routes. Only `admin`/`manager` roles pass; everyone
 * else is bounced to the CRM login, preserving the attempted location so we can
 * redirect back after a successful sign-in.
 *
 * Auth lives in an HttpOnly cookie, so on a fresh page load `user` is null until
 * the `GET /auth/me` bootstrap resolves. We hold the route on a spinner until
 * then to avoid bouncing an authenticated user to the login screen.
 */
export default function RequireCrmAuth() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const location = useLocation();

  if (!initialized) {
    return <FullPageSpinner />;
  }

  const allowed = user !== null && CRM_ROLES.includes(user.role);
  if (!allowed) {
    return <Navigate to="/crm/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
