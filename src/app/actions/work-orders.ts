"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fail, type ActionState } from "@/lib/action-state";
import { date, decimal, FormError, int, oneOf, str } from "@/lib/form";
import { computeNextDue } from "@/lib/maintenance";
import { Prisma } from "@/generated/prisma/client";
import { Priority, RepairMode, WorkOrderItemType, WorkOrderStatus, WorkOrderType } from "@/generated/prisma/enums";
import { getAppSettings } from "@/lib/settings";
import { AuthRequiredError, requireUser } from "@/lib/auth/current-user";
import { run } from "./run";

async function nextWorkOrderCode() {
  const year = new Date().getFullYear();
  const prefix = `WO-${year}-`;
  const last = await prisma.workOrder.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" }, select: { code: true } });
  const seq = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function createWorkOrder(_: ActionState, fd: FormData): Promise<ActionState> {
  let id: string;
  try {
    const me = await requireUser();
    const vehicleId = str(fd, "vehicleId", "รถ", true);
    const scheduledAt = date(fd, "scheduledAt", "วันนัดหมาย");
    const data = {
      vehicleId,
      title: str(fd, "title", "หัวข้องาน", true),
      description: str(fd, "description"),
      type: oneOf(fd, "type", Object.values(WorkOrderType)),
      priority: oneOf(fd, "priority", Object.values(Priority)),
      odometerKm: int(fd, "odometerKm", "เลขไมล์"),
      scheduledAt,
      status: scheduledAt ? WorkOrderStatus.SCHEDULED : WorkOrderStatus.DRAFT,
      providerId: str(fd, "providerId"),
      repairMode: oneOf(fd, "repairMode", Object.values(RepairMode)),
      assignedToId: str(fd, "assignedToId"),
      maintenancePlanId: str(fd, "maintenancePlanId"),
      reportedById: me.id, // the signed-in user is recorded as the reporter
    };
    // Retry once if two people create a work order at the same moment and the code collides
    let wo;
    for (let attempt = 0; ; attempt++) {
      try {
        wo = await prisma.workOrder.create({ data: { ...data, code: await nextWorkOrderCode() } });
        break;
      } catch (e) {
        if (attempt < 2 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
        throw e;
      }
    }
    id = wo.id;
  } catch (error) {
    if (error instanceof FormError || error instanceof AuthRequiredError) return fail(error.message);
    console.error(error);
    return fail("สร้างใบสั่งงานไม่สำเร็จ กรุณาลองใหม่");
  }
  redirect(`/work-orders/${id}`);
}

/** Changes status and handles side effects: start → vehicle under repair; complete → update mileage, plans, vehicle status */
export async function changeWorkOrderStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(fd, "workOrderId", "ใบสั่งงาน", true);
    const status = oneOf(fd, "status", Object.values(WorkOrderStatus));
    if (!status) throw new FormError("สถานะไม่ถูกต้อง");

    const wo = await prisma.workOrder.findUniqueOrThrow({
      where: { id },
      include: { vehicle: { select: { id: true, currentOdometerKm: true } }, items: { select: { serviceTypeId: true } } },
    });
    if (wo.status === "COMPLETED" || wo.status === "CANCELLED") throw new FormError("ใบสั่งงานนี้ปิดไปแล้ว");

    // Outside-garage job: the close form carries the invoice number/date (required unless turned off in settings)
    let invoice: { invoiceNumber?: string; invoiceDate?: Date } = {};
    if (status === "COMPLETED" && wo.repairMode === "EXTERNAL") {
      invoice = { invoiceNumber: str(fd, "invoiceNumber") ?? wo.invoiceNumber ?? undefined, invoiceDate: date(fd, "invoiceDate", "วันที่ใบแจ้งหนี้") ?? wo.invoiceDate ?? undefined };
      if (!invoice.invoiceNumber && (await getAppSettings()).requireInvoiceForExternal) {
        throw new FormError("งานส่งอู่ภายนอก กรุณากรอกเลขที่ใบแจ้งหนี้/ใบเสร็จของอู่ก่อนปิดงาน");
      }
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id },
        data: {
          status,
          startedAt: status === "IN_PROGRESS" && !wo.startedAt ? now : undefined,
          completedAt: status === "COMPLETED" ? now : undefined,
          // Closing the job → goes to cost approval
          approvalStatus: status === "COMPLETED" ? "PENDING" : undefined,
          ...invoice,
        },
      });

      if (status === "IN_PROGRESS") {
        await tx.vehicle.update({ where: { id: wo.vehicleId }, data: { status: "IN_MAINTENANCE" } });
      }

      if (status === "COMPLETED" || status === "CANCELLED") {
        const otherOpen = await tx.workOrder.count({ where: { vehicleId: wo.vehicleId, status: "IN_PROGRESS", id: { not: id } } });
        if (!otherOpen) await tx.vehicle.updateMany({ where: { id: wo.vehicleId, status: "IN_MAINTENANCE" }, data: { status: "ACTIVE" } });
      }

      if (status === "COMPLETED") {
        const km = Math.max(wo.odometerKm ?? 0, wo.vehicle.currentOdometerKm);
        if (wo.odometerKm && wo.odometerKm > wo.vehicle.currentOdometerKm) {
          await tx.vehicle.update({ where: { id: wo.vehicleId }, data: { currentOdometerKm: wo.odometerKm } });
          await tx.odometerReading.create({ data: { vehicleId: wo.vehicleId, readingKm: wo.odometerKm, source: "WORK_ORDER" } });
        }
        // Update the plan for every service covered by this work order
        const serviceTypeIds = new Set(wo.items.map((i) => i.serviceTypeId).filter((x): x is string => !!x));
        const plans = await tx.maintenancePlan.findMany({
          where: { OR: [{ vehicleId: wo.vehicleId, serviceTypeId: { in: [...serviceTypeIds] } }, ...(wo.maintenancePlanId ? [{ id: wo.maintenancePlanId }] : [])] },
          include: { serviceType: true },
        });
        for (const p of plans) {
          const next = computeNextDue({
            lastAt: now,
            lastKm: km,
            intervalKm: p.intervalKm ?? p.serviceType.defaultIntervalKm,
            intervalMonths: p.intervalMonths ?? p.serviceType.defaultIntervalMonths,
          });
          await tx.maintenancePlan.update({ where: { id: p.id }, data: { lastServiceAt: now, lastServiceKm: km, ...next } });
        }
      }
    });

    const messages: Record<string, string> = {
      SCHEDULED: "นัดหมายแล้ว",
      IN_PROGRESS: "เริ่มดำเนินการแล้ว รถถูกตั้งสถานะเป็นกำลังซ่อม",
      ON_HOLD: "พักงานไว้ชั่วคราว",
      COMPLETED: "ปิดงานเรียบร้อย อัปเดตแผนบำรุงรักษาแล้ว · ส่งเข้ารออนุมัติค่าใช้จ่าย",
      CANCELLED: "ยกเลิกใบสั่งงานแล้ว",
    };
    return messages[status] ?? "อัปเดตสถานะแล้ว";
  });
}

async function recalcTotals(tx: Prisma.TransactionClient, workOrderId: string) {
  const items = await tx.workOrderItem.findMany({ where: { workOrderId }, select: { itemType: true, totalCost: true } });
  const sum = (t: WorkOrderItemType) => items.filter((i) => i.itemType === t).reduce((a, i) => a + Number(i.totalCost), 0);
  const laborCost = sum("LABOR");
  const partsCost = sum("PART");
  const otherCost = sum("OTHER");
  await tx.workOrder.update({ where: { id: workOrderId }, data: { laborCost, partsCost, otherCost, totalCost: laborCost + partsCost + otherCost } });
}

export async function addWorkOrderItem(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const workOrderId = str(fd, "workOrderId", "ใบสั่งงาน", true);
    const itemType = oneOf(fd, "itemType", Object.values(WorkOrderItemType));
    if (!itemType) throw new FormError("กรุณาเลือกประเภทรายการ");
    const partId = itemType === "PART" ? str(fd, "partId") : undefined;
    const quantity = decimal(fd, "quantity", "จำนวน") ?? 1;
    if (quantity <= 0) throw new FormError("จำนวนต้องมากกว่า 0");

    const wo = await prisma.workOrder.findUniqueOrThrow({ where: { id: workOrderId }, select: { status: true } });
    if (wo.status === "COMPLETED" || wo.status === "CANCELLED") throw new FormError("ใบสั่งงานนี้ปิดไปแล้ว แก้ไขรายการไม่ได้");

    // Stock is touched only when the company keeps a stock; otherwise every part is a typed-in purchase
    const { inventoryEnabled } = await getAppSettings();
    const part = partId && inventoryEnabled ? await prisma.part.findUniqueOrThrow({ where: { id: partId } }) : null;
    const unitCost = decimal(fd, "unitCost", "ราคาต่อหน่วย") ?? (part ? Number(part.unitCost) : 0);
    const description = str(fd, "description") ?? part?.name;
    if (!description) throw new FormError("กรุณากรอกรายละเอียดรายการ");

    await prisma.$transaction(async (tx) => {
      await tx.workOrderItem.create({
        data: { workOrderId, itemType, description, quantity, unitCost, totalCost: quantity * unitCost, partId: part?.id, serviceTypeId: str(fd, "serviceTypeId") },
      });
      if (part) await tx.part.update({ where: { id: part.id }, data: { stockQuantity: { decrement: quantity } } });
      await recalcTotals(tx, workOrderId);
    });
    return `เพิ่ม "${description}" แล้ว`;
  });
}

export async function removeWorkOrderItem(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(fd, "itemId", "รายการ", true);
    const item = await prisma.workOrderItem.findUniqueOrThrow({ where: { id }, include: { workOrder: { select: { status: true } } } });
    if (item.workOrder.status === "COMPLETED" || item.workOrder.status === "CANCELLED") throw new FormError("ใบสั่งงานนี้ปิดไปแล้ว แก้ไขรายการไม่ได้");
    await prisma.$transaction(async (tx) => {
      await tx.workOrderItem.delete({ where: { id } });
      // Return the part to stock
      if (item.partId) await tx.part.update({ where: { id: item.partId }, data: { stockQuantity: { increment: item.quantity } } });
      await recalcTotals(tx, item.workOrderId);
    });
    return "ลบรายการแล้ว";
  });
}

export async function updateWorkOrderNotes(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const id = str(fd, "workOrderId", "ใบสั่งงาน", true);
    const current = await prisma.workOrder.findUniqueOrThrow({ where: { id }, select: { approvalStatus: true, status: true, repairMode: true } });
    if (current.approvalStatus === "APPROVED") throw new FormError("ใบสั่งงานนี้อนุมัติค่าใช้จ่ายแล้ว แก้ไขไม่ได้");
    const closed = current.status === "COMPLETED" || current.status === "CANCELLED";
    // The repair mode can change only while the job is open (it decides what closing requires)
    const repairMode = closed ? current.repairMode : (oneOf(fd, "repairMode", Object.values(RepairMode)) ?? current.repairMode);
    const invoiceNumber = str(fd, "invoiceNumber") ?? null;
    if (current.status === "COMPLETED" && repairMode === "EXTERNAL" && !invoiceNumber && (await getAppSettings()).requireInvoiceForExternal) {
      throw new FormError("งานส่งอู่ภายนอกที่ปิดแล้ว ต้องมีเลขที่ใบแจ้งหนี้");
    }
    await prisma.workOrder.update({
      where: { id },
      data: {
        repairMode,
        invoiceNumber,
        invoiceDate: date(fd, "invoiceDate", "วันที่ใบแจ้งหนี้") ?? null,
        notes: str(fd, "notes") ?? null,
        providerId: str(fd, "providerId") ?? null,
        assignedToId: str(fd, "assignedToId") ?? null,
      },
    });
    return "บันทึกข้อมูลแล้ว";
  });
}

// ───────────────────── Cost approval ─────────────────────

async function nextApprovalNumber(tx: Prisma.TransactionClient) {
  const prefix = `AP-${new Date().getFullYear()}-`;
  const last = await tx.workOrder.findFirst({ where: { approvalNumber: { startsWith: prefix } }, orderBy: { approvalNumber: "desc" }, select: { approvalNumber: true } });
  const seq = last?.approvalNumber ? Number(last.approvalNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/** Approve costs (ADMIN/MANAGER only): issues an approval number → becomes an expense on the accounting report */
export async function approveWorkOrderCost(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(
    async (me) => {
      const id = str(fd, "workOrderId", "ใบสั่งงาน", true);
      const wo = await prisma.workOrder.findUniqueOrThrow({ where: { id }, select: { status: true, approvalStatus: true, totalCost: true } });
      if (wo.status !== "COMPLETED") throw new FormError("อนุมัติได้เฉพาะใบสั่งงานที่ปิดงานแล้ว");
      if (wo.approvalStatus === "APPROVED") throw new FormError("ใบสั่งงานนี้อนุมัติไปแล้ว");
      if (Number(wo.totalCost) <= 0) throw new FormError("ยังไม่มีค่าใช้จ่ายในใบสั่งงานนี้");

      const number = await prisma.$transaction(async (tx) => {
        const approvalNumber = await nextApprovalNumber(tx);
        await tx.workOrder.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            approvalNumber,
            approvedAt: new Date(),
            approvedById: me.id,
            approvalNote: str(fd, "approvalNote") ?? null,
            expenseAccount: str(fd, "expenseAccount") ?? null,
          },
        });
        return approvalNumber;
      });
      return `อนุมัติค่าใช้จ่ายแล้ว เลขที่ ${number}`;
    },
    "เลขที่ใบอนุมัติซ้ำ กรุณาลองใหม่",
    ["ADMIN", "MANAGER"],
  );
}

/** Reject (with a reason); can be approved again after fixing the information */
export async function rejectWorkOrderCost(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(
    async (me) => {
      const id = str(fd, "workOrderId", "ใบสั่งงาน", true);
      const reason = str(fd, "approvalNote", "เหตุผลที่ไม่อนุมัติ", true);
      const wo = await prisma.workOrder.findUniqueOrThrow({ where: { id }, select: { status: true, approvalStatus: true } });
      if (wo.status !== "COMPLETED") throw new FormError("ใบสั่งงานนี้ยังไม่ได้ปิดงาน");
      if (wo.approvalStatus === "APPROVED") throw new FormError("ใบสั่งงานนี้อนุมัติไปแล้ว");
      await prisma.workOrder.update({
        where: { id },
        data: { approvalStatus: "REJECTED", approvalNote: reason, approvedAt: new Date(), approvedById: me.id },
      });
      return "บันทึกผลไม่อนุมัติแล้ว";
    },
    undefined,
    ["ADMIN", "MANAGER"],
  );
}
