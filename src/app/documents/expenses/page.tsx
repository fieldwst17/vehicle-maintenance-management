import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DocHeader, Paper, SignatureBox } from "@/components/documents/paper";
import { PrintToolbar } from "@/components/documents/print-toolbar";
import { deniedRedirectPath, getViewer } from "@/lib/auth/viewer";
import { bahtText } from "@/lib/baht-text";
import { getApprovedExpenses, parseRange } from "@/lib/expenses";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

export const metadata = { title: "รายงานค่าใช้จ่ายงานซ่อม" };

export default function ExpenseReportPage({ searchParams }: PageProps<"/documents/expenses">) {
  return (
    <Suspense fallback={<p className="text-center text-sm text-zinc-500">กำลังโหลดเอกสาร…</p>}>
      <ExpenseReport searchParams={searchParams} />
    </Suspense>
  );
}

async function ExpenseReport({ searchParams }: { searchParams: PageProps<"/documents/expenses">["searchParams"] }) {
  await connection();
  if (!(await getViewer())) redirect(await deniedRedirectPath());
  const range = parseRange(await searchParams);
  const { items, totals } = await getApprovedExpenses(range);
  const qs = new URLSearchParams(range).toString();
  const cell = "border border-zinc-300 px-1.5 py-1";

  return (
    <>
      <PrintToolbar backHref={`/expenses?${qs}`} excelHref={`/export/expenses?${qs}`} />
      <Paper>
        <DocHeader
          title="รายงานค่าใช้จ่ายงานซ่อมบำรุง"
          subtitle="เฉพาะรายการที่อนุมัติแล้ว"
          meta={[
            { label: "ช่วงวันที่", value: `${formatDate(new Date(range.from))} – ${formatDate(new Date(range.to))}` },
            { label: "จำนวนรายการ", value: totals.count },
            { label: "พิมพ์เมื่อ", value: formatDateTime(new Date()) },
          ]}
        />

        <table className="mt-5 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-zinc-100 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
              {["#", "เลขที่อนุมัติ", "วันที่", "งาน", "รถ", "อู่ / ใบแจ้งหนี้", "บัญชี", "ค่าแรง", "อะไหล่", "อื่น ๆ", "รวม"].map((h, i) => (
                <th key={h} className={`${cell} font-semibold ${i >= 7 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={11} className={`${cell} py-6 text-center text-zinc-500`}>ไม่มีรายการในช่วงวันที่นี้</td></tr>
            ) : (
              items.map((i, n) => (
                <tr key={i.id} className="break-inside-avoid">
                  <td className={`${cell} text-center`}>{n + 1}</td>
                  <td className={`${cell} font-mono`}>{i.approvalNumber}</td>
                  <td className={cell}>{formatDate(i.approvedAt)}</td>
                  <td className={cell}>{i.title}<div className="font-mono text-[10px] text-zinc-500">{i.code}</div></td>
                  <td className={cell}>{i.vehicle}</td>
                  <td className={cell}>{i.provider || "—"}<div className="text-[10px] text-zinc-500">{i.invoiceNumber}</div></td>
                  <td className={`${cell} font-mono`}>{i.expenseAccount || "—"}</td>
                  <td className={`${cell} text-right tabular-nums`}>{formatMoney(i.laborCost)}</td>
                  <td className={`${cell} text-right tabular-nums`}>{formatMoney(i.partsCost)}</td>
                  <td className={`${cell} text-right tabular-nums`}>{formatMoney(i.otherCost)}</td>
                  <td className={`${cell} text-right font-semibold tabular-nums`}>{formatMoney(i.totalCost)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 font-bold print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
              <td colSpan={7} className={`${cell} py-2`}>รวมทั้งสิ้น ({bahtText(totals.totalCost)})</td>
              <td className={`${cell} text-right tabular-nums`}>{formatMoney(totals.laborCost)}</td>
              <td className={`${cell} text-right tabular-nums`}>{formatMoney(totals.partsCost)}</td>
              <td className={`${cell} text-right tabular-nums`}>{formatMoney(totals.otherCost)}</td>
              <td className={`${cell} text-right tabular-nums`}>{formatMoney(totals.totalCost)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-10 grid grid-cols-2 gap-6">
          <SignatureBox role="ผู้จัดทำรายงาน" />
          <SignatureBox role="ผู้ตรวจสอบ / ฝ่ายบัญชี" />
        </div>
      </Paper>
    </>
  );
}
