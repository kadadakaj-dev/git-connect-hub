import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: protect /admin/* routes.
 *
 * Strategy: check for the `access_token` HttpOnly cookie that the
 * NestJS API sets on successful login.  If it is absent, redirect to
 * /login with a `next` query-param so the login page can return the
 * user to the originally requested URL after authentication.
 *
 * The cookie's JWT signature is NOT verified here (that requires the
 * secret, which must stay server-side).  The NestJS API performs full
 * JWT verification on every protected request, so this middleware
 * serves as a fast UX gate — not a security boundary on its own.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin and its sub-paths
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // E2E Bypass
  if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "1") {
    return NextResponse.next();
  }

  // Look for any Supabase auth cookie (usually starts with sb-)
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(cookie => cookie.name.includes("auth-token"));

  // Also check for the old access_token for backward compatibility during migration if needed,
  // but here we focus on Supabase.
  const hasSession = hasSupabaseCookie || Boolean(request.cookies.get("sb-access-token")?.value);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
