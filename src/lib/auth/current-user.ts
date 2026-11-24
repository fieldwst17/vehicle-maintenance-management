import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { GUEST_COOKIE } from "./guest";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/enums";
import { sessionReader } from "./server";

export type CurrentUser = { id: string; email: string; name: string; role: UserRole };

export class AuthRequiredError extends Error {}

/**
 * The signed-in user, who must also be an active user in the users table (the email allowlist).
 * Returns null when not signed in, or when the account isn't registered / has been deactivated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  await connection(); // read cookies only at request time (not during prerender)
  const { data: session } = await sessionReader.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, role: true, isActive: true } });
  if (!user || !user.isActive) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
});

/** Has entered guest mode (guest cookie) */
export async function isGuest(): Promise<boolean> {
  return (await cookies()).get(GUEST_COOKIE)?.value === "1";
}

/** Has a Neon Auth session (even if not on the allowlist) — used to decide whether to sign out first */
export async function hasSession(): Promise<boolean> {
  await connection();
  const { data: session } = await sessionReader.getSession();
  return !!session?.user;
}

/** Use in server actions: throws if there's no valid session (the action turns it into an error message) */
export async function requireUser(roles?: UserRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthRequiredError("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
  if (roles && !roles.includes(user.role)) throw new AuthRequiredError("คุณไม่มีสิทธิ์ทำรายการนี้");
  return user;
}
