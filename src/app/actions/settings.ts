"use server";

import type { ActionState } from "@/lib/action-state";
import { bool } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { run } from "./run";

/** Save company-wide settings (ADMIN only) */
export async function updateAppSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(
    async () => {
      const data = { inventoryEnabled: bool(fd, "inventoryEnabled"), requireInvoiceForExternal: bool(fd, "requireInvoiceForExternal") };
      await prisma.appSetting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
      return "บันทึกการตั้งค่าแล้ว";
    },
    undefined,
    ["ADMIN"],
  );
}
