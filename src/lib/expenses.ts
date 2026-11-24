import "server-only";
import { prisma } from "./prisma";
import { toNumber } from "./format";

// Expense data (approved work orders) — shared by the page, Excel, and PDF so the numbers always match

/** Default date range = current month, Bangkok time (yyyy-mm-dd) */
export function defaultRange() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, "0")}` };
}

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Reads ?from=&to= from the URL (falls back to the current month when invalid) */
export function parseRange(sp: Record<string, string | string[] | undefined>) {
  const d = defaultRange();
  const from = isDate(sp.from) ? sp.from : d.from;
  const to = isDate(sp.to) ? sp.to : d.to;
  return from <= to ? { from, to } : { from: to, to: from };
}

export async function getApprovedExpenses(range: { from: string; to: string }) {
  const rows = await prisma.workOrder.findMany({
    where: {
      approvalStatus: "APPROVED",
      approvedAt: { gte: new Date(`${range.from}T00:00:00+07:00`), lte: new Date(`${range.to}T23:59:59.999+07:00`) },
    },
    orderBy: { approvedAt: "asc" },
    include: {
      vehicle: { select: { plateNumber: true, plateProvince: true, brand: true, model: true } },
      provider: { select: { name: true, taxId: true } },
      approvedBy: { select: { name: true } },
    },
  });

  const items = rows.map((w) => ({
    id: w.id,
    approvalNumber: w.approvalNumber ?? "",
    approvedAt: w.approvedAt!,
    code: w.code,
    title: w.title,
    vehicle: `${w.vehicle.plateNumber} ${w.vehicle.plateProvince}`,
    vehicleName: `${w.vehicle.brand} ${w.vehicle.model}`,
    provider: w.provider?.name ?? "",
    invoiceNumber: w.invoiceNumber ?? "",
    expenseAccount: w.expenseAccount ?? "",
    approvedBy: w.approvedBy?.name ?? "",
    laborCost: toNumber(w.laborCost),
    partsCost: toNumber(w.partsCost),
    otherCost: toNumber(w.otherCost),
    totalCost: toNumber(w.totalCost),
  }));

  const sum = (k: "laborCost" | "partsCost" | "otherCost" | "totalCost") => items.reduce((a, i) => a + i[k], 0);
  return { items, totals: { laborCost: sum("laborCost"), partsCost: sum("partsCost"), otherCost: sum("otherCost"), totalCost: sum("totalCost"), count: items.length } };
}

/** Full data for one approval document */
export async function getApprovalDocument(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: true,
      provider: true,
      approvedBy: { select: { name: true, role: true } },
      reportedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
      items: { orderBy: { createdAt: "asc" }, include: { part: { select: { partNumber: true, unit: true } } } },
    },
  });
  if (!wo || wo.approvalStatus !== "APPROVED") return null;
  return wo;
}
