import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole, UserStatus } from "@myapp/shared";
import type { AuthUser } from "@myapp/shared";

// Mock the axios client so the store logic is tested in isolation.
vi.mock("./apiClient", () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
  readCookie: vi.fn(),
}));

import { apiClient } from "./apiClient";
import { useAuthStore } from "./authStore";

const post = apiClient.post as ReturnType<typeof vi.fn>;
const get = apiClient.get as ReturnType<typeof vi.fn>;

function user(role: UserRole): AuthUser {
  return {
    id: "u1",
    email: "a@b.c",
    name: "A",
    role,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    sessionVersion: 0,
  };
}

const creds = { email: "a@b.c", password: "pw" };

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: null,
    status: "idle",
    error: null,
    initialized: false,
  });
});

describe("authStore.login", () => {
  it("stores the user on success", async () => {
    post.mockResolvedValueOnce({
      data: { user: user(UserRole.ADMIN), csrfToken: "t" },
    });
    await useAuthStore.getState().login(creds, "crm");
    const s = useAuthStore.getState();
    expect(s.user?.role).toBe(UserRole.ADMIN);
    expect(s.status).toBe("idle");
  });

  it("rejects a non-staff role on CRM login and signs back out", async () => {
    post.mockImplementation((url: string) => {
      if (url === "/auth/login") {
        return Promise.resolve({
          data: { user: user(UserRole.CUSTOMER), csrfToken: "t" },
        });
      }
      return Promise.resolve({}); // /auth/logout
    });

    await expect(useAuthStore.getState().login(creds, "crm")).rejects.toThrow(
      "notAuthorized",
    );
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.error).toBe("notAuthorized");
    expect(post).toHaveBeenCalledWith("/auth/logout");
  });

  it("allows a customer on an ecommerce login", async () => {
    post.mockResolvedValueOnce({
      data: { user: user(UserRole.CUSTOMER), csrfToken: "t" },
    });
    await useAuthStore.getState().login(creds, "ecommerce");
    expect(useAuthStore.getState().user?.role).toBe(UserRole.CUSTOMER);
  });

  it("surfaces an error and clears the user on failure", async () => {
    post.mockRejectedValueOnce(new Error("401"));
    await expect(useAuthStore.getState().login(creds, "crm")).rejects.toThrow();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.status).toBe("error");
  });
});

describe("authStore.bootstrap", () => {
  it("rehydrates the user from GET /auth/me", async () => {
    get.mockResolvedValueOnce({ data: { user: user(UserRole.MANAGER), csrfToken: "t" } });
    await useAuthStore.getState().bootstrap();
    const s = useAuthStore.getState();
    expect(s.user?.role).toBe(UserRole.MANAGER);
    expect(s.initialized).toBe(true);
  });

  it("marks initialized with no user when unauthenticated (401)", async () => {
    get.mockRejectedValueOnce(new Error("401"));
    await useAuthStore.getState().bootstrap();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.initialized).toBe(true);
  });
});

describe("authStore.logout", () => {
  it("clears the user even if the network call fails", async () => {
    useAuthStore.setState({ user: user(UserRole.ADMIN) });
    post.mockRejectedValueOnce(new Error("network"));
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
