import "server-only";
import ExcelJS from "exceljs";

// Shared helpers for building .xlsx files (Thai font, header style, number formats)

export const MONEY_FMT = '#,##0.00;[Red]-#,##0.00';
const FONT = "Tahoma"; // ships with Windows/macOS and renders Thai correctly in Excel

export function newWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FleetCare";
  wb.created = new Date();
  return wb;
}

/** Bold title + subtitle at the top of a sheet */
export function addTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string, width: number) {
  ws.mergeCells(1, 1, 1, width);
  ws.getCell(1, 1).value = title;
  ws.getCell(1, 1).font = { name: FONT, size: 14, bold: true };
  ws.mergeCells(2, 1, 2, width);
  ws.getCell(2, 1).value = subtitle;
  ws.getCell(2, 1).font = { name: FONT, size: 10, color: { argb: "FF64748B" } };
}

/** Table header row (purple background, white text, borders) */
export function styleHeader(row: ExcelJS.Row) {
  row.eachCell((c) => {
    c.font = { name: FONT, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = border;
  });
  row.height = 22;
}

const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

export function styleBody(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (c) => {
    c.font = { name: FONT, ...(c.font ?? {}) };
    c.border = border;
    c.alignment = { vertical: "top", wrapText: true, ...(c.alignment ?? {}) };
  });
}

export function styleTotal(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (c) => {
    c.font = { name: FONT, bold: true };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF0FF" } };
    c.border = border;
  });
}

/** Builds an .xlsx download response (Thai filename via filename*) */
export async function xlsxResponse(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
