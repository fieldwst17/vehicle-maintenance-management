import { getViewer } from "@/lib/auth/viewer";
import { bahtText } from "@/lib/baht-text";
import { addTitle, MONEY_FMT, newWorkbook, styleBody, styleHeader, styleTotal, xlsxResponse } from "@/lib/excel";
import { getApprovalDocument } from "@/lib/expenses";
import { formatDate, toNumber } from "@/lib/format";
import { itemType, repairMode, workOrderType } from "@/lib/labels";

// Approval document for one work order → .xlsx
export async function GET(_: Request, ctx: RouteContext<"/export/approval/[id]">) {
  if (!(await getViewer())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const wo = await getApprovalDocument(id);
  if (!wo) return Response.json({ error: "Not found or not approved" }, { status: 404 });

  const wb = newWorkbook();
  const ws = wb.addWorksheet(wo.approvalNumber ?? "ใบอนุมัติ", { pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  ws.columns = [{ width: 8 }, { width: 40 }, { width: 14 }, { width: 10 }, { width: 15 }, { width: 16 }];
  addTitle(ws, "ใบอนุมัติค่าใช้จ่ายงานซ่อมบำรุง", `เลขที่ ${wo.approvalNumber} · อนุมัติ ${formatDate(wo.approvedAt)} · อ้างอิง ${wo.code}`, 6);

  // Header information (label : value)
  const info: [string, string][] = [
    ["ทะเบียนรถ", `${wo.vehicle.plateNumber} ${wo.vehicle.plateProvince}`],
    ["ยี่ห้อ / รุ่น", `${wo.vehicle.brand} ${wo.vehicle.model}`],
    ["หัวข้องาน", wo.title],
    ["ประเภทงาน", `${workOrderType[wo.type].label} · ${repairMode[wo.repairMode].label}`],
    ["วันที่ปิดงาน", formatDate(wo.completedAt)],
    ["อู่ / ศูนย์บริการ", wo.provider?.name ?? "—"],
    ["เลขผู้เสียภาษีของอู่", wo.provider?.taxId ?? "—"],
    ["เลขที่ใบแจ้งหนี้", wo.invoiceNumber ?? "—"],
    ["วันที่ในใบแจ้งหนี้", formatDate(wo.invoiceDate)],
    ["รหัสบัญชีค่าใช้จ่าย", wo.expenseAccount ?? "—"],
    ["ผู้อนุมัติ", wo.approvedBy?.name ?? "—"],
    ["หมายเหตุ", wo.approvalNote ?? "—"],
  ];
  ws.addRow([]);
  for (const [label, value] of info) {
    const r = ws.addRow([label, value]);
    ws.mergeCells(r.number, 2, r.number, 6);
    r.getCell(1).font = { name: "Tahoma", color: { argb: "FF64748B" } };
    r.getCell(2).font = { name: "Tahoma", bold: true };
  }
  ws.addRow([]);

  styleHeader(ws.addRow(["ลำดับ", "รายการ", "ประเภท", "จำนวน", "ราคา/หน่วย", "จำนวนเงิน"]));
  const firstItemRow = ws.rowCount + 1;
  wo.items.forEach((it, i) => {
    const r = ws.addRow([i + 1, it.description + (it.part?.partNumber ? ` [${it.part.partNumber}]` : ""), itemType[it.itemType].label, toNumber(it.quantity), toNumber(it.unitCost), toNumber(it.totalCost)]);
    r.getCell(5).numFmt = MONEY_FMT;
    r.getCell(6).numFmt = MONEY_FMT;
    styleBody(r);
  });
  const lastItemRow = ws.rowCount;

  for (const [label, v] of [["ค่าแรง", wo.laborCost], ["ค่าอะไหล่", wo.partsCost], ["ค่าใช้จ่ายอื่น ๆ", wo.otherCost]] as const) {
    const r = ws.addRow(["", "", "", "", label, toNumber(v)]);
    r.getCell(6).numFmt = MONEY_FMT;
    styleBody(r);
  }
  const total = ws.addRow([`(${bahtText(toNumber(wo.totalCost))})`, "", "", "", "รวมทั้งสิ้น", wo.items.length ? { formula: `SUM(F${firstItemRow}:F${lastItemRow})`, result: toNumber(wo.totalCost) } : 0]);
  ws.mergeCells(total.number, 1, total.number, 4);
  total.getCell(6).numFmt = MONEY_FMT;
  styleTotal(total);

  return xlsxResponse(wb, `FleetCare-${wo.approvalNumber}.xlsx`);
}
