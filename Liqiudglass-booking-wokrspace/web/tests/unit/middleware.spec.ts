/**
 * Unit tests: Next.js middleware (middleware.ts)
 *
 * Tests cover:
 *  - Non-admin routes pass through untouched
 *  - Admin route without session cookie → redirect to /login?next=...
 *  - Admin route with access_token cookie → passes through
 *  - The ?next= param is correctly set to the original pathname
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost${pathname}`;
  const req = new NextRequest(url);
  // Manually set cookies by injecting the header value
  if (Object.keys(cookies).length > 0) {
    const cookieStr = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    return new NextRequest(url, { headers: { cookie: cookieStr } });
  }
  return req;
}

describe("middleware", () => {
  it("lets through requests to non-admin paths without a cookie", () => {
    const res = middleware(makeRequest("/"));
    expect(res.status).toBe(200);
  });

  it("lets through requests to /login", () => {
    const res = middleware(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("redirects /admin to /login when no access_token cookie is present", () => {
    const res = middleware(makeRequest("/admin"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fadmin");
  });

  it("preserves the full path in the ?next= redirect param", () => {
    const res = middleware(makeRequest("/admin/settings/bookings"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("next=%2Fadmin%2Fsettings%2Fbookings");
  });

  it("allows /admin access when access_token cookie is set", () => {
    const res = middleware(makeRequest("/admin", { access_token: "fake.jwt.token" }));
    expect(res.status).toBe(200);
  });

  it("allows /admin sub-routes when access_token cookie is set", () => {
    const res = middleware(makeRequest("/admin/bookings", { access_token: "fake.jwt.token" }));
    expect(res.status).toBe(200);
  });
});