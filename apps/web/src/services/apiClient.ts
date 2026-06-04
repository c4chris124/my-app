import axios from "axios";

/**
 * Shared axios instance for the whole app.
 *
 * In dev the Vite proxy forwards "/api" → the NestJS container, and MSW
 * intercepts these same requests when its worker is running (see src/mocks).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

/**
 * Sets (or clears) the bearer token applied to every request. Called by the
 * auth store on login/logout and on rehydrating a persisted session — kept here
 * so the store depends on the client, never the reverse.
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}
