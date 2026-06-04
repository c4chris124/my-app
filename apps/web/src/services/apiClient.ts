import axios from "axios";

/**
 * Shared axios instance for the whole app.
 *
 * In dev the Vite proxy forwards "/api" → the NestJS container, and MSW
 * intercepts these same requests when its worker is running (see src/mocks).
 * The auth token interceptor will be added once the auth store lands.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});
