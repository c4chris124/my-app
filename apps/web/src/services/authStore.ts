import { create } from "zustand";
import { UserRole, CRM_ROLES } from "@myapp/shared";
import type { AuthUser, LoginResponse, MeResponse } from "@myapp/shared";
import { apiClient } from "./apiClient";

// Re-exported so existing consumers keep importing auth types/roles from here.
export { UserRole, CRM_ROLES };
export type { AuthUser };

/** Which storefront the login originated from — determines the expected role. */
export type AuthDomain = "ecommerce" | "crm";

export interface Credentials {
  email: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "error";
  error: string | null;
  /** False until the initial `GET /auth/me` bootstrap has resolved. */
  initialized: boolean;
  login: (credentials: Credentials, domain: AuthDomain) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

/** Roles permitted into the CRM storefront. */
function isCrmRole(role: UserRole): boolean {
  return CRM_ROLES.includes(role);
}

/**
 * Cookie-session auth store. The session lives in an HttpOnly cookie the JS
 * never sees; this store only mirrors the *public* user projection for the UI.
 * It is intentionally NOT persisted — the cookie is the single source of truth,
 * and `bootstrap()` rehydrates `user` from `GET /auth/me` on app start.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "idle",
  error: null,
  initialized: false,

  login: async (credentials, domain) => {
    set({ status: "loading", error: null });
    try {
      const { data } = await apiClient.post<LoginResponse>(
        "/auth/login",
        credentials,
      );
      // CRM sign-in must resolve to a staff role; otherwise reject + sign out.
      if (domain === "crm" && !isCrmRole(data.user.role)) {
        await apiClient.post("/auth/logout").catch(() => {});
        set({ status: "error", error: "notAuthorized", user: null });
        throw new Error("notAuthorized");
      }
      set({ user: data.user, status: "idle", error: null });
    } catch (err) {
      // Preserve a specific error already set above; otherwise generic.
      set((s) => ({
        status: "error",
        error: s.error ?? "invalidCredentials",
        user: null,
      }));
      throw err instanceof Error ? err : new Error("invalidCredentials");
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Best-effort — clear local state regardless of the network result.
    }
    set({ user: null, status: "idle", error: null });
  },

  bootstrap: async () => {
    try {
      const { data } = await apiClient.get<MeResponse>("/auth/me");
      set({ user: data.user, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },
}));
