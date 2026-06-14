import { http, HttpResponse, delay } from "msw";
import { UserRole, UserStatus } from "@myapp/shared";
import type { AuthUser, SessionInfo } from "@myapp/shared";

/**
 * Cookie-session auth mock (dev only). Mirrors the real API contract:
 *  - login/register set a readable `csrf` cookie + a `mock-auth` marker cookie
 *    (the real session cookie is HttpOnly and can't be emulated from JS, so the
 *    marker stands in so the session survives a page reload), and
 *  - `/auth/me` rehydrates from that marker.
 * There is no bearer token anywhere.
 */

interface LoginBody {
  email?: string;
  password?: string;
}
interface RegisterBody extends LoginBody {
  name?: string;
}

const MOCK_AUTH_COOKIE = "mock-auth";
const CSRF_COOKIE = "csrf";

function randomToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join("");
}

// CRM is the only authed storefront today, so demo logins default to staff.
// An email containing "customer" yields a customer (to exercise role gating).
function roleForEmail(email: string): UserRole {
  if (email.includes("customer")) return UserRole.CUSTOMER;
  if (email.includes("manager")) return UserRole.MANAGER;
  return UserRole.ADMIN;
}

function userFor(email: string, name?: string): AuthUser {
  return {
    id: "usr-mock-1",
    name: name ?? email.split("@")[0],
    email,
    role: roleForEmail(email),
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    sessionVersion: 0,
  };
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** Set the csrf + mock-auth cookies and return the issued csrf token. */
function setAuthCookies(headers: Headers, user: AuthUser): string {
  const csrf = randomToken();
  const marker = encodeURIComponent(JSON.stringify(user));
  headers.append("Set-Cookie", `${CSRF_COOKIE}=${csrf}; Path=/; SameSite=Lax`);
  headers.append(
    "Set-Cookie",
    `${MOCK_AUTH_COOKIE}=${marker}; Path=/; SameSite=Lax`,
  );
  return csrf;
}

function currentUser(request: Request): AuthUser | null {
  const raw = readCookie(request, MOCK_AUTH_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as LoginBody;
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
    const user = userFor(body.email);
    const headers = new Headers();
    const csrfToken = setAuthCookies(headers, user);
    return HttpResponse.json({ user, csrfToken }, { headers });
  }),

  http.post("/api/auth/register", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as RegisterBody;
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: "Invalid registration" },
        { status: 400 },
      );
    }
    const user = userFor(body.email, body.name);
    const headers = new Headers();
    const csrfToken = setAuthCookies(headers, user);
    return HttpResponse.json({ user, csrfToken }, { status: 201, headers });
  }),

  http.get("/api/auth/me", ({ request }) => {
    const user = currentUser(request);
    if (!user) {
      return HttpResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      user,
      csrfToken: readCookie(request, CSRF_COOKIE) ?? randomToken(),
    });
  }),

  http.post("/api/auth/logout", () => {
    const headers = new Headers();
    headers.append("Set-Cookie", `${MOCK_AUTH_COOKIE}=; Path=/; Max-Age=0`);
    headers.append("Set-Cookie", `${CSRF_COOKIE}=; Path=/; Max-Age=0`);
    return new HttpResponse(null, { status: 204, headers });
  }),

  http.get("/api/auth/sessions", ({ request }) => {
    const user = currentUser(request);
    if (!user) {
      return HttpResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }
    const now = Date.now();
    const sessions: SessionInfo[] = [
      {
        id: "sess-current",
        current: true,
        domain: "crm",
        ipCreated: "127.0.0.1",
        ipLastSeen: "127.0.0.1",
        deviceLabel: "Chrome on this device",
        userAgent: navigator.userAgent,
        createdAt: new Date(now - 3_600_000).toISOString(),
        lastSeenAt: new Date(now).toISOString(),
        absoluteExpiresAt: new Date(now + 30 * 86_400_000).toISOString(),
      },
      {
        id: "sess-other",
        current: false,
        domain: "crm",
        ipCreated: "10.0.0.42",
        ipLastSeen: "10.0.0.42",
        deviceLabel: "Safari on iPhone",
        userAgent: "Mozilla/5.0 (iPhone)",
        createdAt: new Date(now - 5 * 86_400_000).toISOString(),
        lastSeenAt: new Date(now - 86_400_000).toISOString(),
        absoluteExpiresAt: new Date(now + 25 * 86_400_000).toISOString(),
      },
    ];
    return HttpResponse.json(sessions);
  }),

  http.delete(
    "/api/auth/sessions/:id",
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.post("/api/auth/sessions/revoke-others", () =>
    HttpResponse.json({ revoked: 1 }),
  ),
];
