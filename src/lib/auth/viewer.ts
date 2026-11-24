import "server-only";
import { getCurrentUser, hasSession, isGuest, type CurrentUser } from "./current-user";

export type Viewer = { kind: "user"; user: CurrentUser } | { kind: "guest" } | null;

/** Who is viewing: an allowlisted user, a guest (only when there's no session), or nobody */
export async function getViewer(): Promise<Viewer> {
  const user = await getCurrentUser();
  if (user) return { kind: "user", user };
  if (!(await hasSession()) && (await isGuest())) return { kind: "guest" };
  return null;
}

/** Where to send someone without access: signed in but not on the allowlist → sign out first */
export async function deniedRedirectPath(): Promise<string> {
  return (await hasSession()) ? "/auth/sign-out?reason=not-allowed" : "/auth/sign-in";
}
