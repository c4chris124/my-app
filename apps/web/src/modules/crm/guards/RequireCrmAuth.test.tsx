// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { UserRole, UserStatus } from "@myapp/shared";
import type { AuthUser } from "@myapp/shared";
import RequireCrmAuth from "./RequireCrmAuth";
import { useAuthStore } from "../../../services/authStore";

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

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/crm/dashboard"]}>
      <Routes>
        <Route element={<RequireCrmAuth />}>
          <Route path="/crm/dashboard" element={<div>PROTECTED</div>} />
        </Route>
        <Route path="/crm/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);
beforeEach(() => {
  useAuthStore.setState({ user: null, initialized: false, status: "idle", error: null });
});

describe("RequireCrmAuth", () => {
  it("holds on a spinner until auth is initialized (no premature redirect)", () => {
    useAuthStore.setState({ user: null, initialized: false });
    renderGuard();
    expect(screen.queryByText("PROTECTED")).toBeNull();
    expect(screen.queryByText("LOGIN")).toBeNull();
  });

  it("renders the protected outlet for a staff role", () => {
    useAuthStore.setState({ user: user(UserRole.ADMIN), initialized: true });
    renderGuard();
    expect(screen.getByText("PROTECTED")).toBeInTheDocument();
  });

  it("redirects a customer to the CRM login", () => {
    useAuthStore.setState({ user: user(UserRole.CUSTOMER), initialized: true });
    renderGuard();
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor once initialized", () => {
    useAuthStore.setState({ user: null, initialized: true });
    renderGuard();
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });
});
