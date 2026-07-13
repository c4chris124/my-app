import type { SessionInfo } from "@myapp/shared";
import { apiClient } from "../../../services/apiClient";

/** Active sessions/devices for the signed-in user, current one flagged. */
export async function fetchSessions(): Promise<SessionInfo[]> {
  const { data } = await apiClient.get<SessionInfo[]>("/auth/sessions");
  return data;
}

/** Revoke a single session by its public id. */
export async function revokeSession(id: string): Promise<void> {
  await apiClient.delete(`/auth/sessions/${id}`);
}

/** Revoke every session except the current device. */
export async function revokeOtherSessions(): Promise<{ revoked: number }> {
  const { data } = await apiClient.post<{ revoked: number }>(
    "/auth/sessions/revoke-others",
  );
  return data;
}
