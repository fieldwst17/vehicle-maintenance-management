import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { BadgeCheck, Coins, FileSpreadsheet, FileText, Hourglass, Package, Receipt, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LabelBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, Skeleton, StatCard, Table, TableSkeleton, Td, Th, Tr } from "@/components/ui/data";
import { DateRangeFilter } from "@/components/ui/filters";
import { getApprovedExpenses, parseRange } from "@/lib/expenses";
import { formatDate, formatMoney } from "@/lib/format";
import { approvalStatus } from "@/lib/labels";

export const metadata = { title: "ค่าใช้จ่าย" };

export default function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  return (
    <>
      <PageHeader icon={<Coins />} title="ค่าใช้จ่ายงานซ่อม" description="รายการค่าใช้จ่ายที่อนุมัติแล้ว สำหรับส่งฝ่ายบัญชี · Export เป็น Excel หรือ PDF ได้" />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Expenses searchParams={searchParams} />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<Card><TableSkeleton rows={3} /></Card>}>
          <PendingApprovals />
        </Suspense>
      </div>
    </>
  );
}

async function Expenses({ searchParams }: { searchParams: PageProps<"/expenses">["searchParams"] }) {
  await connection();
  const range = parseRange(await searchParams);
  const { items, totals } = await getApprovedExpenses(range);
  const qs = new URLSearchParams(range).toString();

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <DateRangeFilter from={range.from} to={range.to} />
        <div className="flex gap-2">
          <ButtonLink href={`/documents/expenses?${qs}`} target="_blank" variant="secondary"><FileText />PDF</ButtonLink>
          <ButtonLink href={`/export/expenses?${qs}`} prefetch={false} variant="primary"><FileSpreadsheet />Export Excel</ButtonLink>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ค่าใช้จ่ายรวม" value={formatMoney(totals.totalCost)} hint={`${totals.count} รายการที่อนุมัติ`} icon={<Coins />} accent="primary" />
        <StatCard label="ค่าแรง" value={formatMoney(totals.laborCost)} icon={<Wrench />} accent="info" delay={60} />
        <StatCard label="ค่าอะไหล่" value={formatMoney(totals.partsCost)} icon={<Package />} accent="warning" delay={120} />
        <StatCard label="อื่น ๆ" value={formatMoney(totals.otherCost)} icon={<Receipt />} accent="success" delay={180} />
      </div>

      <Card className="animate-fade-up overflow-hidden">
        <CardHeader icon={<BadgeCheck />} title="รายการที่อนุมัติแล้ว" description={`${formatDate(new Date(range.from))} – ${formatDate(new Date(range.to))}`} />
        {items.length === 0 ? (
          <EmptyState icon={<Coins />} title="ไม่มีค่าใช้จ่ายที่อนุมัติในช่วงนี้" description="ค่าใช้จ่ายจะเข้ามาที่นี่เมื่อปิดงานและได้รับการอนุมัติ" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>เลขที่อนุมัติ</Th><Th>วันที่</Th><Th>งาน</Th><Th>รถ</Th><Th>อู่ / เลขที่ใบแจ้งหนี้</Th><Th>รหัสบัญชี</Th><Th className="text-right">ยอดรวม</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <Tr key={i.id}>
                  <Td className="font-mono text-xs">
                    <Link href={`/documents/approval/${i.id}`} target="_blank" className="text-primary hover:underline">{i.approvalNumber}</Link>
                  </Td>
                  <Td className="text-muted">{formatDate(i.approvedAt)}</Td>
                  <Td>
                    <Link href={`/work-orders/${i.id}`} className="font-medium hover:text-primary">{i.title}</Link>
                    <p className="font-mono text-xs text-muted">{i.code}</p>
                  </Td>
                  <Td>{i.vehicle}<p className="text-xs text-muted">{i.vehicleName}</p></Td>
                  <Td>{i.provider || "—"}<p className="text-xs text-muted">{i.invoiceNumber || " "}</p></Td>
                  <Td className="font-mono text-xs">{i.expenseAccount || "—"}</Td>
                  <Td className="text-right font-semibold tabular-nums">{formatMoney(i.totalCost)}</Td>
                </Tr>
              ))}
              <tr>
                <Td className="bg-surface-2/60 font-semibold" />
                <Td className="bg-surface-2/60" />
                <Td className="bg-surface-2/60 font-semibold">รวมทั้งสิ้น</Td>
                <Td className="bg-surface-2/60" />
                <Td className="bg-surface-2/60" />
                <Td className="bg-surface-2/60" />
                <Td className="bg-surface-2/60 text-right text-base font-semibold tabular-nums text-primary">{formatMoney(totals.totalCost)}</Td>
              </tr>
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

async function PendingApprovals() {
  await connection();
  const pending = await prisma.workOrder.findMany({
    where: { status: "COMPLETED", approvalStatus: { in: ["PENDING", "REJECTED"] } },
    orderBy: { completedAt: "asc" },
    include: { vehicle: { select: { plateNumber: true } } },
  });
  return (
    <Card className="animate-fade-up">
      <CardHeader icon={<Hourglass />} title="รอการอนุมัติ" description="งานที่ปิดแล้วแต่ยังไม่ได้อนุมัติค่าใช้จ่าย" />
      {pending.length === 0 ? (
        <EmptyState icon={<BadgeCheck />} title="ไม่มีงานค้างอนุมัติ" />
      ) : (
        <ul className="divide-y divide-border">
          {pending.map((w) => (
            <li key={w.id}>
              <Link href={`/work-orders/${w.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-primary-soft/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{w.title}</p>
                  <p className="text-xs text-muted">{w.code} · {w.vehicle.plateNumber} · ปิดงาน {formatDate(w.completedAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">{formatMoney(w.totalCost)}</span>
                  <LabelBadge entry={approvalStatus[w.approvalStatus ?? "PENDING"]} pulse={w.approvalStatus === "PENDING"} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
