import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewWorkOrderButton } from "@/components/forms/work-order-form";
import { LabelBadge } from "@/components/ui/badge";
import { ButtonFallback } from "@/components/ui/button-fallback";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, TableSkeleton, Td, Th, Tr } from "@/components/ui/data";
import { FilterTabs, SearchInput } from "@/components/ui/filters";
import { formatDate, formatMoney } from "@/lib/format";
import { approvalStatus, priority, workOrderStatus, workOrderType } from "@/lib/labels";
import type { WorkOrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "ใบสั่งงานซ่อม" };

export default function WorkOrdersPage({ searchParams }: PageProps<"/work-orders">) {
  return (
    <>
      <PageHeader
        icon={<ClipboardList />}
        title="ใบสั่งงานซ่อม"
        description="ติดตามงานซ่อมตั้งแต่แจ้งปัญหาจนปิดงาน"
        actions={
          <Suspense fallback={<ButtonFallback label="สร้างใบสั่งงาน" />}>
            <NewWorkOrderButton />
          </Suspense>
        }
      />
      <Suspense fallback={<Card><TableSkeleton rows={8} /></Card>}>
        <WorkOrderTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function WorkOrderTable({ searchParams }: { searchParams: PageProps<"/work-orders">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && sp.status in workOrderStatus ? (sp.status as WorkOrderStatus) : undefined;

  const where = q
    ? {
        OR: [
          { code: { contains: q, mode: "insensitive" as const } },
          { title: { contains: q, mode: "insensitive" as const } },
          { vehicle: { plateNumber: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [orders, counts] = await Promise.all([
    prisma.workOrder.findMany({
      where: { ...where, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { vehicle: { select: { plateNumber: true, brand: true, model: true } }, provider: { select: { name: true } } },
    }),
    prisma.workOrder.groupBy({ by: ["status"], where, _count: true }),
  ]);
  const countOf = (s?: WorkOrderStatus) => (s ? counts.find((c) => c.status === s)?._count ?? 0 : counts.reduce((a, c) => a + c._count, 0));

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          param="status"
          options={[
            { value: "", label: "ทั้งหมด", count: countOf() },
            ...(Object.keys(workOrderStatus) as WorkOrderStatus[]).map((s) => ({ value: s, label: workOrderStatus[s].label, count: countOf(s) })),
          ]}
        />
        <SearchInput placeholder="ค้นหาเลขที่ หัวข้อ ทะเบียน…" />
      </div>
      <Card className="animate-fade-up overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState icon={<ClipboardList />} title={q || status ? "ไม่พบใบสั่งงานที่ตรงกับเงื่อนไข" : "ยังไม่มีใบสั่งงาน"} description="กดปุ่ม สร้างใบสั่งงาน เพื่อเริ่มต้น" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>เลขที่</Th><Th>งาน</Th><Th>รถ</Th><Th>ประเภท</Th><Th>ความเร่งด่วน</Th><Th>สถานะ</Th><Th className="text-right">ค่าใช้จ่าย</Th><Th />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Tr key={o.id} className="group">
                  <Td className="font-mono text-xs text-muted">{o.code}</Td>
                  <Td>
                    <Link href={`/work-orders/${o.id}`} className="font-medium transition-colors hover:text-primary">{o.title}</Link>
                    <p className="text-xs text-muted">{formatDate(o.scheduledAt ?? o.createdAt)}{o.provider ? ` · ${o.provider.name}` : ""}</p>
                  </Td>
                  <Td>
                    <p className="font-medium">{o.vehicle.plateNumber}</p>
                    <p className="text-xs text-muted">{o.vehicle.brand} {o.vehicle.model}</p>
                  </Td>
                  <Td><LabelBadge entry={workOrderType[o.type]} dot={false} /></Td>
                  <Td><LabelBadge entry={priority[o.priority]} pulse={o.priority === "CRITICAL"} /></Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <LabelBadge entry={workOrderStatus[o.status]} pulse={o.status === "IN_PROGRESS"} />
                      {o.approvalStatus ? <LabelBadge entry={approvalStatus[o.approvalStatus]} dot={false} /> : null}
                    </div>
                  </Td>
                  <Td className="text-right font-medium tabular-nums">{formatMoney(o.totalCost)}</Td>
                  <Td>
                    <Link href={`/work-orders/${o.id}`} aria-label="ดูรายละเอียด" className="grid size-8 place-items-center rounded-lg text-muted transition-all group-hover:bg-primary-soft group-hover:text-primary">
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
