import { NextResponse, type NextRequest } from "next/server";
import { NEON_AUTH_COOKIE_PREFIX } from "@neon/auth/server";
import { auth } from "@/lib/auth/server";
import { GUEST_COOKIE, isGuestAllowedPath } from "@/lib/auth/guest";

// Every page requires sign-in, except the auth pages (/auth/sign-in, /auth/sign-up, /api/auth, ... are public by default)
const requireAuth = auth.middleware({ loginUrl: "/auth/sign-in" });

export default async function proxy(request: NextRequest) {
  const isGuest = request.cookies.get(GUEST_COOKIE)?.value === "1";
  if (isGuest && isGuestAllowedPath(request.nextUrl.pathname)) {
    const hasAuthCookie = request.cookies.getAll().some((c) => c.name.includes(NEON_AUTH_COOKIE_PREFIX));
    // Guest with no session cookie → view-only access (the app enforces read-only on the server)
    if (!hasAuthCookie) return NextResponse.next();

    // Guest still holding a session cookie (e.g. an expired session): let the middleware refresh/clear it,
    // otherwise the render would have to call Neon Auth itself and write cookies (which Next.js forbids during render)
    const res = await requireAuth(request);
    if (res.headers.get("location")) {
      // Session invalid → middleware wants to send them to login; guest mode keeps viewing but clears the stale cookie
      const next = NextResponse.next();
      for (const cookie of res.headers.getSetCookie()) next.headers.append("Set-Cookie", cookie);
      return next;
    }
    return res;
  }
  return requireAuth(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
