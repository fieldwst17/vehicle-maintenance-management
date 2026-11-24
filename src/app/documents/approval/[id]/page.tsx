import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { DocHeader, DocSection, InfoGrid, Paper, SignatureBox } from "@/components/documents/paper";
import { PrintToolbar } from "@/components/documents/print-toolbar";
import { deniedRedirectPath, getViewer } from "@/lib/auth/viewer";
import { bahtText } from "@/lib/baht-text";
import { getApprovalDocument } from "@/lib/expenses";
import { formatDate, formatKm, formatMoney, formatNumber, toNumber } from "@/lib/format";
import { itemType, workOrderType } from "@/lib/labels";

export const metadata = { title: "ใบอนุมัติค่าใช้จ่าย" };

export default function ApprovalDocumentPage({ params }: PageProps<"/documents/approval/[id]">) {
  return (
    <Suspense fallback={<p className="text-center text-sm text-zinc-500">กำลังโหลดเอกสาร…</p>}>
      <ApprovalDocument params={params} />
    </Suspense>
  );
}

async function ApprovalDocument({ params }: { params: PageProps<"/documents/approval/[id]">["params"] }) {
  await connection();
  if (!(await getViewer())) redirect(await deniedRedirectPath());
  const { id } = await params;
  const wo = await getApprovalDocument(id);
  if (!wo) notFound();

  const total = toNumber(wo.totalCost);

  return (
    <>
      <PrintToolbar backHref={`/work-orders/${wo.id}`} excelHref={`/export/approval/${wo.id}`} />
      <Paper>
        <DocHeader
          title="ใบอนุมัติค่าใช้จ่ายงานซ่อมบำรุง"
          subtitle="Vehicle Maintenance Expense Approval"
          meta={[
            { label: "เลขที่", value: wo.approvalNumber },
            { label: "วันที่อนุมัติ", value: formatDate(wo.approvedAt) },
            { label: "อ้างอิงใบสั่งงาน", value: wo.code },
          ]}
        />

        <DocSection title="1. ข้อมูลยานพาหนะ">
          <InfoGrid
            items={[
              { label: "ทะเบียนรถ", value: `${wo.vehicle.plateNumber} ${wo.vehicle.plateProvince}` },
              { label: "ยี่ห้อ / รุ่น", value: `${wo.vehicle.brand} ${wo.vehicle.model}${wo.vehicle.year ? ` (${wo.vehicle.year})` : ""}` },
              { label: "เลขตัวถัง (VIN)", value: wo.vehicle.vin ?? "—" },
              { label: "เลขไมล์เข้ารับบริการ", value: formatKm(wo.odometerKm ?? wo.vehicle.currentOdometerKm) },
            ]}
          />
        </DocSection>

        <DocSection title="2. รายละเอียดงาน">
          <InfoGrid
            items={[
              { label: "หัวข้องาน", value: wo.title },
              { label: "ประเภทงาน", value: workOrderType[wo.type].label },
              { label: "วันที่เริ่มงาน", value: formatDate(wo.startedAt) },
              { label: "วันที่ปิดงาน", value: formatDate(wo.completedAt) },
              { label: "อู่ / ศูนย์บริการ", value: wo.provider?.name ?? "—" },
              { label: "เลขผู้เสียภาษีของอู่", value: wo.provider?.taxId ?? "—" },
              { label: "เลขที่ใบแจ้งหนี้", value: wo.invoiceNumber ?? "—" },
              { label: "ผู้รับผิดชอบ", value: wo.assignedTo?.name ?? "—" },
            ]}
          />
          {wo.description ? <p className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-zinc-700">{wo.description}</p> : null}
        </DocSection>

        <DocSection title="3. รายการค่าใช้จ่าย">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-zinc-100 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                {["ลำดับ", "รายการ", "ประเภท", "จำนวน", "ราคา/หน่วย", "จำนวนเงิน"].map((h, i) => (
                  <th key={h} className={`border border-zinc-300 px-2 py-1.5 font-semibold ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wo.items.map((it, i) => (
                <tr key={it.id} className="break-inside-avoid">
                  <td className="border border-zinc-300 px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-zinc-300 px-2 py-1.5">
                    {it.description}
                    {it.part?.partNumber ? <span className="text-zinc-500"> [{it.part.partNumber}]</span> : null}
                  </td>
                  <td className="border border-zinc-300 px-2 py-1.5">{itemType[it.itemType].label}</td>
                  <td className="border border-zinc-300 px-2 py-1.5 text-right tabular-nums">{formatNumber(it.quantity)}</td>
                  <td className="border border-zinc-300 px-2 py-1.5 text-right tabular-nums">{formatMoney(it.unitCost)}</td>
                  <td className="border border-zinc-300 px-2 py-1.5 text-right tabular-nums">{formatMoney(it.totalCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {[
                ["ค่าแรง", wo.laborCost],
                ["ค่าอะไหล่", wo.partsCost],
                ["ค่าใช้จ่ายอื่น ๆ", wo.otherCost],
              ].map(([label, v]) => (
                <tr key={String(label)}>
                  <td colSpan={5} className="border border-zinc-300 px-2 py-1 text-right text-zinc-600">{String(label)}</td>
                  <td className="border border-zinc-300 px-2 py-1 text-right tabular-nums">{formatMoney(v as never)}</td>
                </tr>
              ))}
              <tr className="bg-indigo-50 font-bold print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                <td colSpan={3} className="border border-zinc-300 px-2 py-2 text-left font-semibold">({bahtText(total)})</td>
                <td colSpan={2} className="border border-zinc-300 px-2 py-2 text-right">รวมทั้งสิ้น</td>
                <td className="border border-zinc-300 px-2 py-2 text-right tabular-nums">{formatMoney(total)}</td>
              </tr>
            </tfoot>
          </table>
        </DocSection>

        <DocSection title="4. การอนุมัติ">
          <InfoGrid
            items={[
              { label: "ผลการพิจารณา", value: <span className="font-bold text-emerald-700">อนุมัติ</span> },
              { label: "รหัสบัญชีค่าใช้จ่าย", value: wo.expenseAccount ?? "—" },
              { label: "หมายเหตุ", value: wo.approvalNote ?? "—" },
            ]}
          />
        </DocSection>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <SignatureBox role="ผู้แจ้งซ่อม / ผู้ขอเบิก" name={wo.reportedBy?.name} />
          <SignatureBox role="ผู้อนุมัติ" name={wo.approvedBy?.name} date={formatDate(wo.approvedAt)} />
          <SignatureBox role="ฝ่ายบัญชี / การเงิน" />
        </div>

        <p className="mt-8 border-t border-zinc-200 pt-2 text-[10px] text-zinc-400">
          เอกสารนี้สร้างจากระบบ FleetCare · อนุมัติในระบบโดย {wo.approvedBy?.name ?? "—"} เมื่อ {formatDate(wo.approvedAt)}
        </p>
      </Paper>
    </>
  );
}
