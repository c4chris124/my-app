import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, setAuthToken } from "./apiClient";

export type UserRole = "customer" | "admin" | "manager";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Which storefront the login originated from — determines the expected role. */
export type AuthDomain = "ecommerce" | "crm";

export interface Credentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: "idle" | "loading" | "error";
  error: string | null;
  login: (credentials: Credentials, domain: AuthDomain) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "rehobot-auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      status: "idle",
      error: null,

      login: async (credentials, domain) => {
        set({ status: "loading", error: null });
        try {
          const { data } = await apiClient.post<LoginResponse>("/auth/login", {
            ...credentials,
            domain,
          });
          setAuthToken(data.token);
          set({ user: data.user, token: data.token, status: "idle" });
        } catch {
          set({
            status: "error",
            error: "invalidCredentials",
            user: null,
            token: null,
          });
          setAuthToken(null);
          throw new Error("invalidCredentials");
        }
      },

      logout: () => {
        setAuthToken(null);
        set({ user: null, token: null, status: "idle", error: null });
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist the session itself, not transient request status.
      partialize: (state) => ({ user: state.user, token: state.token }),
      // Re-apply the bearer token to axios when a session is restored.
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    },
  ),
);

/** True when a user with a CRM-capable role is signed in. */
export const CRM_ROLES: UserRole[] = ["admin", "manager"];
