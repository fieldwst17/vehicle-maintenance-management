// Amount in Thai words, e.g. 1250.50 → "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์"

const DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const UNITS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

/** Reads a number below one million */
function readBelowMillion(n: number): string {
  const s = String(n);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const d = Number(s[i]);
    const pos = s.length - i - 1;
    if (d === 0) continue;
    if (pos === 1 && d === 1) out += "สิบ";
    else if (pos === 1 && d === 2) out += "ยี่สิบ";
    else if (pos === 0 && d === 1 && s.length > 1) out += "เอ็ด";
    else out += DIGITS[d] + UNITS[pos];
  }
  return out;
}

function readInteger(n: number): string {
  if (n === 0) return "ศูนย์";
  let out = "";
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  if (millions > 0) out += readInteger(millions) + "ล้าน";
  // In "x ล้าน 1", the trailing 1 is read as เอ็ด
  if (rest > 0) out += rest === 1 && n > 1 ? "เอ็ด" : readBelowMillion(rest);
  return out;
}

export function bahtText(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const negative = amount < 0;
  const satangTotal = Math.round(Math.abs(amount) * 100);
  const baht = Math.floor(satangTotal / 100);
  const satang = satangTotal % 100;
  let text = "";
  if (baht > 0 || satang === 0) text += readInteger(baht) + "บาท";
  text += satang === 0 ? "ถ้วน" : readBelowMillion(satang) + "สตางค์";
  return (negative ? "ลบ" : "") + text;
}
