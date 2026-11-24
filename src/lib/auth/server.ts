import "server-only";
import { cookies, headers } from "next/headers";
import { createNeonAuth } from "@neon/auth/next/server";
import { createAuthServer, extractNeonAuthCookies } from "@neon/auth/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL!;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET!;

// Neon Auth (Managed Better Auth): users/sessions live in the neon_auth schema on Neon
// Use `auth` in server actions / route handlers / proxy (places where cookies can be written)
export const auth = createNeonAuth({ baseUrl, cookies: { secret: cookieSecret } });

/**
 * Read-only session reader for Server Components (page render).
 *
 * Why it's needed: once the session cookie cache expires (default 5 minutes), `auth.getSession()` calls Neon Auth
 * upstream and tries to write a new cookie back, but Next.js forbids writing cookies during render
 * ("Cookies can only be modified in a Server Action or Route Handler").
 * This reader uses the same cookie but makes setCookie a no-op; refreshing the cookie is left to the proxy (middleware),
 * which runs on every request and is allowed to write cookies.
 */
export const sessionReader = createAuthServer({
  baseUrl,
  cookieSecret,
  context: async () => {
    const headerStore = await headers();
    await cookies(); // mark render as request-time
    return {
      getCookies: () => extractNeonAuthCookies(headerStore),
      setCookie: () => {
        /* no-op during render — the proxy refreshes the cookie */
      },
      getHeader: (name: string) => headerStore.get(name) ?? null,
      getOrigin: () => headerStore.get("origin") || headerStore.get("referer")?.split("/").slice(0, 3).join("/") || "",
      getFramework: () => "nextjs",
    };
  },
});
