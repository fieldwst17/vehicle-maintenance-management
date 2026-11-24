// Maintenance plan due-date logic (by distance or time, whichever comes first)
import type { Tone } from "./labels";

export function addMonths(d: Date, months: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

/** Computes the next due point from the last service and the interval */
export function computeNextDue(opts: { lastAt: Date; lastKm: number; intervalKm?: number | null; intervalMonths?: number | null }) {
  return {
    nextDueKm: opts.intervalKm ? opts.lastKm + opts.intervalKm : null,
    nextDueAt: opts.intervalMonths ? addMonths(opts.lastAt, opts.intervalMonths) : null,
  };
}

export type DueState = { key: "overdue" | "soon" | "ok" | "none"; label: string; tone: Tone; detail: string };

const SOON_KM = 1000;
const SOON_DAYS = 14;

export function dueState(plan: { nextDueKm: number | null; nextDueAt: Date | null }, currentKm: number): DueState {
  if (plan.nextDueKm === null && plan.nextDueAt === null) return { key: "none", label: "ยังไม่กำหนด", tone: "neutral", detail: "" };

  const kmLeft = plan.nextDueKm !== null ? plan.nextDueKm - currentKm : null;
  const daysLeft = plan.nextDueAt !== null ? Math.round((new Date(plan.nextDueAt).getTime() - Date.now()) / 86_400_000) : null;

  const parts: string[] = [];
  if (kmLeft !== null) parts.push(kmLeft >= 0 ? `อีก ${kmLeft.toLocaleString("th-TH")} กม.` : `เกิน ${(-kmLeft).toLocaleString("th-TH")} กม.`);
  if (daysLeft !== null) parts.push(daysLeft >= 0 ? `อีก ${daysLeft} วัน` : `เลย ${-daysLeft} วัน`);
  const detail = parts.join(" · ");

  if ((kmLeft !== null && kmLeft < 0) || (daysLeft !== null && daysLeft < 0)) return { key: "overdue", label: "เลยกำหนด", tone: "danger", detail };
  if ((kmLeft !== null && kmLeft <= SOON_KM) || (daysLeft !== null && daysLeft <= SOON_DAYS)) return { key: "soon", label: "ใกล้ถึงกำหนด", tone: "warning", detail };
  return { key: "ok", label: "ปกติ", tone: "success", detail };
}
