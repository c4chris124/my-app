import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CRM_ROLES, useAuthStore } from "../../../services/authStore";

/**
 * Gates the CRM's protected routes. Only `admin`/`manager` roles pass; everyone
 * else is bounced to the CRM login, preserving the attempted location so we can
 * redirect back after a successful sign-in.
 */
export default function RequireCrmAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const allowed = user !== null && CRM_ROLES.includes(user.role);
  if (!allowed) {
    return <Navigate to="/crm/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
