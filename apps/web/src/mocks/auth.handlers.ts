import { http, HttpResponse, delay } from "msw";
import type { AuthDomain, AuthUser } from "../services/authStore";

interface LoginBody {
  email?: string;
  password?: string;
  domain?: AuthDomain;
}

// A CRM login yields a staff role; an e-commerce login yields a customer.
function roleForDomain(domain: AuthDomain | undefined): AuthUser["role"] {
  return domain === "crm" ? "admin" : "customer";
}

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as LoginBody;

    // Mock validation: any non-empty email + password is accepted.
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const user: AuthUser = {
      id: "usr-1",
      name: body.email.split("@")[0],
      email: body.email,
      role: roleForDomain(body.domain),
    };

    return HttpResponse.json({ token: `mock-jwt.${user.id}.${Date.now()}`, user });
  }),
];
