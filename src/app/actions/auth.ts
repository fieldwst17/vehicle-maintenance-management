"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GUEST_COOKIE, GUEST_MAX_AGE } from "@/lib/auth/guest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/server";
import { fail, type ActionState } from "@/lib/action-state";

/** Allow only same-site paths (blocks open redirects such as //evil.com) */
function safeRedirect(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") && !s.startsWith("/auth") ? s : "/";
}

// @neon/auth converts Better Auth codes into Supabase-style codes (e.g. INVALID_EMAIL_OR_PASSWORD → invalid_credentials)
function authErrorMessage(error: { code?: string; message?: string; status?: number } | null | undefined): string {
  switch (error?.code) {
    case "invalid_credentials":
    case "user_not_found":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "user_already_exists":
      return "อีเมลนี้เปิดใช้งานบัญชีแล้ว กรุณาเข้าสู่ระบบ";
    case "weak_password":
      return "รหัสผ่านต้องมี 8–128 ตัวอักษร";
    case "email_address_invalid":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "email_not_confirmed":
      return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
    case "over_request_rate_limit":
      return "พยายามหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
  }
  if (error?.status === 401) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (error?.status === 429) return "พยายามหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
  console.error("[auth] unexpected error", error);
  return "ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง";
}

function readCredentials(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  return { email, password };
}

export async function signInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { email, password } = readCredentials(fd);
  if (!email || !password) return fail("กรุณากรอกอีเมลและรหัสผ่าน");

  // Allowlist: only active users on the users page can sign in
  const member = await prisma.user.findUnique({ where: { email }, select: { isActive: true } });
  if (!member) return fail("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  if (!member.isActive) return fail("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");

  const { error } = await auth.signIn.email({ email, password });
  if (error) return fail(authErrorMessage(error));
  await clearGuest();
  redirect(safeRedirect(fd.get("redirectTo")));
}

/**
 * Activate an account (first sign-up): the email must already be on the users page.
 * Exception: while the users table is empty, the first person to sign up becomes ADMIN, to bootstrap the system.
 */
export async function signUpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { email, password } = readCredentials(fd);
  const name = String(fd.get("name") ?? "").trim();
  if (!email || !password) return fail("กรุณากรอกอีเมลและรหัสผ่าน");
  if (password.length < 8) return fail("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  if (password !== String(fd.get("confirmPassword") ?? "")) return fail("รหัสผ่านทั้งสองช่องไม่ตรงกัน");

  const [member, userCount] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { name: true, isActive: true } }),
    prisma.user.count(),
  ]);
  const bootstrap = userCount === 0;
  if (!member && !bootstrap) return fail("อีเมลนี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน กรุณาให้ผู้ดูแลระบบเพิ่มในหน้าผู้ใช้งานก่อน");
  if (member && !member.isActive) return fail("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");

  const displayName = name || member?.name || email.split("@")[0];
  const { error } = await auth.signUp.email({ email, password, name: displayName });
  if (error) return fail(authErrorMessage(error));

  if (bootstrap) {
    await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: displayName, role: "ADMIN" } });
  }
  // Sign up may not create a session (e.g. when email verification is on) → sign in again to be sure
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    const { error: signInError } = await auth.signIn.email({ email, password });
    if (signInError) return fail(authErrorMessage(signInError));
  }
  await clearGuest();
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await auth.signOut();
  redirect("/auth/sign-in");
}

/** Enter guest mode (view only) */
export async function enterGuestAction(): Promise<void> {
  const jar = await cookies();
  jar.set(GUEST_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: GUEST_MAX_AGE });
  redirect("/");
}

/** Leave guest mode and go to the sign-in page */
export async function exitGuestAction(): Promise<void> {
  (await cookies()).delete(GUEST_COOKIE);
  redirect("/auth/sign-in");
}

async function clearGuest() {
  (await cookies()).delete(GUEST_COOKIE);
}
