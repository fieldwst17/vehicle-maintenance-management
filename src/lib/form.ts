// Read and validate FormData values in server actions

export class FormError extends Error {}

export function str(fd: FormData, key: string, label: string, required: true): string;
export function str(fd: FormData, key: string, label?: string, required?: false): string | undefined;
export function str(fd: FormData, key: string, label = key, required = false) {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) {
    if (required) throw new FormError(`กรุณากรอก${label}`);
    return undefined;
  }
  return s;
}

export function int(fd: FormData, key: string, label = key, required = false): number | undefined {
  const s = str(fd, key, label, required as false);
  if (s === undefined) return undefined;
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isInteger(n) || n < 0) throw new FormError(`${label} ต้องเป็นจำนวนเต็มไม่ติดลบ`);
  return n;
}

export function decimal(fd: FormData, key: string, label = key, required = false): number | undefined {
  const s = str(fd, key, label, required as false);
  if (s === undefined) return undefined;
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new FormError(`${label} ต้องเป็นตัวเลขไม่ติดลบ`);
  return n;
}

export function date(fd: FormData, key: string, label = key, required = false): Date | undefined {
  const s = str(fd, key, label, required as false);
  if (s === undefined) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new FormError(`${label} ไม่ถูกต้อง`);
  return d;
}

export function oneOf<T extends string>(fd: FormData, key: string, values: readonly T[], fallback?: T): T | undefined {
  const s = str(fd, key);
  if (s && (values as readonly string[]).includes(s)) return s as T;
  return fallback;
}

export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}
