import axios from "axios";

/**
 * Shared axios instance for the whole app.
 *
 * In dev the Vite proxy forwards "/api" → the NestJS container, and MSW
 * intercepts these same requests when its worker is running (see src/mocks).
 *
 * Auth is **cookie-based** (HttpOnly session + double-submit CSRF), so:
 *  - `withCredentials` sends the session cookie on every request, and
 *  - a request interceptor mirrors the readable `csrf` cookie into the
 *    `X-CSRF-Token` header for state-changing verbs (the API enforces that the
 *    header matches both the cookie and the server-side session token).
 * There is no bearer token and nothing auth-related in localStorage.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
});

const CSRF_COOKIE = "csrf";
const MUTATING = new Set(["post", "put", "patch", "delete"]);

/** Read a non-HttpOnly cookie value by name (used for the CSRF token). */
export function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (MUTATING.has(method)) {
    const token = readCookie(CSRF_COOKIE);
    if (token) {
      config.headers.set("X-CSRF-Token", token);
    }
  }
  return config;
});
