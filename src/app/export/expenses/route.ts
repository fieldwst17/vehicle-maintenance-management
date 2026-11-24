import { getViewer } from "@/lib/auth/viewer";
import { getApprovedExpenses, parseRange } from "@/lib/expenses";
import { addTitle, MONEY_FMT, newWorkbook, styleBody, styleHeader, styleTotal, xlsxResponse } from "@/lib/excel";
import { formatDate } from "@/lib/format";

// Expense report (approved) for the date range ?from=&to= → .xlsx
export async function GET(request: Request) {
  if (!(await getViewer())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const range = parseRange(sp);
  const { items, totals } = await getApprovedExpenses(range);

  const wb = newWorkbook();
  const ws = wb.addWorksheet("ค่าใช้จ่ายงานซ่อม", { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  const columns = [
    { header: "ลำดับ", key: "no", width: 7 },
    { header: "เลขที่อนุมัติ", key: "approvalNumber", width: 15 },
    { header: "วันที่อนุมัติ", key: "approvedAt", width: 13 },
    { header: "เลขที่ใบสั่งงาน", key: "code", width: 15 },
    { header: "รายการงาน", key: "title", width: 32 },
    { header: "ทะเบียนรถ", key: "vehicle", width: 20 },
    { header: "ยี่ห้อ/รุ่น", key: "vehicleName", width: 20 },
    { header: "อู่ / ศูนย์บริการ", key: "provider", width: 24 },
    { header: "เลขที่ใบแจ้งหนี้", key: "invoiceNumber", width: 16 },
    { header: "รหัสบัญชี", key: "expenseAccount", width: 11 },
    { header: "ค่าแรง", key: "laborCost", width: 13 },
    { header: "ค่าอะไหล่", key: "partsCost", width: 13 },
    { header: "อื่น ๆ", key: "otherCost", width: 13 },
    { header: "รวม", key: "totalCost", width: 14 },
    { header: "ผู้อนุมัติ", key: "approvedBy", width: 18 },
  ];
  ws.columns = columns.map(({ key, width }) => ({ key, width }));
  addTitle(ws, "รายงานค่าใช้จ่ายงานซ่อมบำรุง (อนุมัติแล้ว)", `ช่วงวันที่ ${formatDate(new Date(range.from))} – ${formatDate(new Date(range.to))} · ${totals.count} รายการ`, columns.length);
  const header = ws.addRow(columns.map((c) => c.header));
  styleHeader(header);
  ws.views = [{ state: "frozen", ySplit: header.number }]; // freeze the header row when scrolling

  items.forEach((i, n) => {
    const row = ws.addRow({ ...i, no: n + 1, approvedAt: i.approvedAt });
    row.getCell("approvedAt").numFmt = "dd/mm/yyyy";
    for (const k of ["laborCost", "partsCost", "otherCost", "totalCost"]) row.getCell(k).numFmt = MONEY_FMT;
    styleBody(row);
  });

  // Total row as formulas, so it still works if accounting edits the file
  const first = header.number + 1;
  const last = header.number + items.length;
  const total = ws.addRow({ title: "รวมทั้งสิ้น" });
  for (const k of ["laborCost", "partsCost", "otherCost", "totalCost"]) {
    const col = ws.getColumn(k).letter;
    const cell = total.getCell(k);
    cell.value = items.length ? { formula: `SUM(${col}${first}:${col}${last})`, result: totals[k as keyof typeof totals] } : 0;
    cell.numFmt = MONEY_FMT;
  }
  styleTotal(total);
  ws.autoFilter = { from: { row: header.number, column: 1 }, to: { row: header.number, column: columns.length } };

  return xlsxResponse(wb, `FleetCare-ค่าใช้จ่าย-${range.from}_${range.to}.xlsx`);
}
