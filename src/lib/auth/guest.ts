// Guest mode: view-only access without signing in (cannot add/edit data, cannot see the users page)

export const GUEST_COOKIE = "fc_guest";
export const GUEST_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Paths guests may not open: the users page (staff contact details) and the APIs */
const GUEST_BLOCKED = ["/users", "/api"];

export function isGuestAllowedPath(pathname: string): boolean {
  return !GUEST_BLOCKED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
