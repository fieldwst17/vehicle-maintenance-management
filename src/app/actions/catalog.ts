"use server";

import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";
import { bool, decimal, FormError, int, oneOf, str } from "@/lib/form";
import { UserRole } from "@/generated/prisma/enums";
import { run } from "./run";

export async function createServiceType(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const code = str(fd, "code", "รหัส", true).toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const s = await prisma.serviceType.create({
      data: {
        code,
        name: str(fd, "name", "ชื่องานบริการ", true),
        description: str(fd, "description"),
        defaultIntervalKm: int(fd, "defaultIntervalKm", "รอบ กม."),
        defaultIntervalMonths: int(fd, "defaultIntervalMonths", "รอบเดือน"),
      },
    });
    return `เพิ่มงานบริการ "${s.name}" แล้ว`;
  }, "รหัสงานบริการนี้มีอยู่แล้ว");
}

export async function createProvider(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const p = await prisma.serviceProvider.create({
      data: {
        name: str(fd, "name", "ชื่ออู่", true),
        isInternal: bool(fd, "isInternal"),
        contactName: str(fd, "contactName"),
        phone: str(fd, "phone"),
        email: str(fd, "email"),
        address: str(fd, "address"),
        taxId: str(fd, "taxId"),
      },
    });
    return `เพิ่ม "${p.name}" แล้ว`;
  });
}

export async function createPart(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const p = await prisma.part.create({
      data: {
        partNumber: str(fd, "partNumber", "รหัสอะไหล่", true),
        name: str(fd, "name", "ชื่ออะไหล่", true),
        unit: str(fd, "unit") ?? "pcs",
        unitCost: decimal(fd, "unitCost", "ราคาต่อหน่วย") ?? 0,
        stockQuantity: decimal(fd, "stockQuantity", "จำนวนคงเหลือ") ?? 0,
        reorderLevel: decimal(fd, "reorderLevel", "จุดสั่งซื้อ"),
      },
    });
    return `เพิ่มอะไหล่ "${p.name}" แล้ว`;
  }, "รหัสอะไหล่นี้มีอยู่แล้ว");
}

export async function adjustStock(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const delta = Number(str(fd, "delta", "จำนวน", true));
    if (!Number.isFinite(delta) || delta === 0) throw new FormError("จำนวนไม่ถูกต้อง");
    const p = await prisma.part.update({ where: { id: str(fd, "partId", "อะไหล่", true) }, data: { stockQuantity: { increment: delta } } });
    return `${delta > 0 ? "รับเข้า" : "เบิกออก"} ${Math.abs(delta)} ${p.unit} · คงเหลือ ${Number(p.stockQuantity)}`;
  });
}

export async function createUser(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const email = str(fd, "email", "อีเมล", true).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FormError("รูปแบบอีเมลไม่ถูกต้อง");
    const u = await prisma.user.create({
      data: { email, name: str(fd, "name", "ชื่อ", true), phone: str(fd, "phone"), role: oneOf(fd, "role", Object.values(UserRole)) },
    });
    return `เพิ่มผู้ใช้ ${u.name} แล้ว · ให้ผู้ใช้กด "เปิดใช้งานบัญชี" ที่หน้าเข้าสู่ระบบด้วยอีเมลนี้`;
  }, "อีเมลนี้มีอยู่ในระบบแล้ว", ["ADMIN", "MANAGER"]);
}

export async function toggleActive(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async (me) => {
    const id = str(fd, "id", "รายการ", true);
    const active = fd.get("active") === "true";
    const kind = str(fd, "kind", "ประเภท", true);
    const data = { isActive: active };
    if (kind === "user") {
      if (me.role !== "ADMIN" && me.role !== "MANAGER") throw new FormError("คุณไม่มีสิทธิ์จัดการผู้ใช้งาน");
      if (id === me.id && !active) throw new FormError("ไม่สามารถปิดใช้งานบัญชีของตัวเองได้");
    }
    if (kind === "serviceType") await prisma.serviceType.update({ where: { id }, data });
    else if (kind === "provider") await prisma.serviceProvider.update({ where: { id }, data });
    else if (kind === "part") await prisma.part.update({ where: { id }, data });
    else if (kind === "user") await prisma.user.update({ where: { id }, data });
    else throw new FormError("ประเภทไม่ถูกต้อง");
    return active ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว";
  });
}
