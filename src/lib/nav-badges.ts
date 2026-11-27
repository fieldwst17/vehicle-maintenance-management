import "server-only";
import { prisma } from "./prisma";
import { dueState } from "./maintenance";
import { daysFromNow } from "./format";
import type { NavBadges } from "./query-keys";
import { getAppSettings } from "./settings";

/** Counts shown next to sidebar items: things that need someone's attention */
export async function getNavBadges(): Promise<NavBadges> {
  const [plans, expiringDocs, pendingApprovals, parts, settings] = await Promise.all([
    prisma.maintenancePlan.findMany({
      where: { isActive: true, vehicle: { status: { not: "RETIRED" } } },
      select: { nextDueKm: true, nextDueAt: true, vehicle: { select: { currentOdometerKm: true } } },
    }),
    prisma.vehicleDocument.count({ where: { expiryDate: { lte: daysFromNow(30) }, vehicle: { status: { not: "RETIRED" } } } }),
    prisma.workOrder.count({ where: { status: "COMPLETED", approvalStatus: "PENDING" } }),
    prisma.part.findMany({ where: { isActive: true, reorderLevel: { not: null } }, select: { stockQuantity: true, reorderLevel: true } }),
    getAppSettings(),
  ]);

  const states = plans.map((p) => dueState(p, p.vehicle.currentOdometerKm).key);
  const overdue = states.filter((s) => s === "overdue").length;
  const soon = states.filter((s) => s === "soon").length;
  const lowStock = parts.filter((p) => Number(p.stockQuantity) <= Number(p.reorderLevel)).length;

  const badge = (count: number, tone: "danger" | "warning" | "primary") => (count > 0 ? { count, tone } : undefined);
  return {
    "/maintenance": badge(overdue + soon, overdue ? "danger" : "warning"),
    "/vehicles": badge(expiringDocs, "warning"),
    "/expenses": badge(pendingApprovals, "primary"),
    "/parts": settings.inventoryEnabled ? badge(lowStock, "danger") : undefined,
  };
}
