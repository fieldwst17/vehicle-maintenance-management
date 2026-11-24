import "server-only";
import { refresh } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { FormError } from "@/lib/form";
import { AuthRequiredError, requireUser, type CurrentUser } from "@/lib/auth/current-user";
import type { UserRole } from "@/generated/prisma/enums";

/**
 * Runs a mutation: checks the session (and role, if given) first, translates errors into messages for the UI,
 * and refreshes the page on success
 */
export async function run(
  fn: (user: CurrentUser) => Promise<string>,
  duplicateMessage = "ข้อมูลนี้มีอยู่แล้วในระบบ",
  roles?: UserRole[],
): Promise<ActionState> {
  try {
    const user = await requireUser(roles);
    const message = await fn(user);
    refresh();
    return ok(message);
  } catch (error) {
    if (error instanceof FormError || error instanceof AuthRequiredError) return fail(error.message);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return fail(duplicateMessage);
      if (error.code === "P2003") return fail("ไม่สามารถทำรายการได้ เนื่องจากข้อมูลถูกใช้งานอยู่");
      if (error.code === "P2025") return fail("ไม่พบข้อมูลที่ต้องการ");
    }
    console.error(error);
    return fail("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  }
}
