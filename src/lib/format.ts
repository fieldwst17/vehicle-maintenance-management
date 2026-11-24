// Display helpers: Thai-locale date, currency, number formatting

type DecimalLike = { toString(): string } | number | string | null | undefined;

export function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("th-TH");
const dateFmt = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const dateTimeFmt = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

export const formatMoney = (v: DecimalLike) => thb.format(toNumber(v));
export const formatNumber = (v: DecimalLike) => num.format(toNumber(v));
export const formatKm = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${num.format(v)} กม.`);
export const formatDate = (d: Date | null | undefined) => (d ? dateFmt.format(d) : "—");
export const formatDateTime = (d: Date | null | undefined) => (d ? dateTimeFmt.format(d) : "—");

/** Date `days` days from now */
export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

/** Days from today to `d` (negative = already past) */
export function daysUntil(d: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** yyyy-mm-dd for <input type="date"> */
export function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}
