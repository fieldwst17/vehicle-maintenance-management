import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewWorkOrderButton } from "@/components/forms/work-order-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard, Table, TableSkeleton, Td, Th, Tr } from "@/components/ui/data";
import { FilterTabs } from "@/components/ui/filters";
import { formatDate, formatKm } from "@/lib/format";
import { dueState } from "@/lib/maintenance";
import { AlertOctagon, CheckCircle2, Hourglass } from "lucide-react";

export const metadata = { title: "แผนบำรุงรักษา" };

export default function MaintenancePage({ searchParams }: PageProps<"/maintenance">) {
  return (
    <>
      <PageHeader icon={<CalendarClock />} title="แผนบำรุงรักษา" description="รายการบำรุงรักษาตามระยะของรถทุกคัน เรียงตามความเร่งด่วน" />
      <Suspense fallback={<Card><TableSkeleton rows={8} /></Card>}>
        <Plans searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const order = { overdue: 0, soon: 1, ok: 2, none: 3 } as const;

async function Plans({ searchParams }: { searchParams: PageProps<"/maintenance">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const filter = typeof sp.due === "string" ? sp.due : "";

  const plans = await prisma.maintenancePlan.findMany({
    where: { isActive: true, vehicle: { status: { not: "RETIRED" } } },
    include: {
      vehicle: { select: { id: true, plateNumber: true, plateProvince: true, brand: true, model: true, currentOdometerKm: true } },
      serviceType: { select: { name: true } },
    },
  });
  const rows = plans.map((p) => ({ p, s: dueState(p, p.vehicle.currentOdometerKm) })).sort((a, b) => order[a.s.key] - order[b.s.key]);
  const count = (k: keyof typeof order) => rows.filter((r) => r.s.key === k).length;
  const visible = filter ? rows.filter((r) => r.s.key === filter) : rows;

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="เลยกำหนด" value={count("overdue")} icon={<AlertOctagon />} accent="danger" />
        <StatCard label="ใกล้ถึงกำหนด" value={count("soon")} icon={<Hourglass />} accent="warning" delay={60} />
        <StatCard label="ปกติ" value={count("ok")} icon={<CheckCircle2 />} accent="success" delay={120} />
      </div>
      <div className="mb-5">
        <FilterTabs
          param="due"
          options={[
            { value: "", label: "ทั้งหมด", count: rows.length },
            { value: "overdue", label: "เลยกำหนด", count: count("overdue") },
            { value: "soon", label: "ใกล้ถึงกำหนด", count: count("soon") },
            { value: "ok", label: "ปกติ", count: count("ok") },
          ]}
        />
      </div>
      <Card className="animate-fade-up overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState icon={<CalendarClock />} title="ไม่มีรายการ" description="เพิ่มแผนบำรุงรักษาได้ในหน้ารายละเอียดของรถแต่ละคัน" />
        ) : (
          <Table>
            <thead>
              <tr><Th>รถ</Th><Th>งานบริการ</Th><Th>ครั้งถัดไป</Th><Th>สถานะ</Th><Th /></tr>
            </thead>
            <tbody>
              {visible.map(({ p, s }) => (
                <Tr key={p.id}>
                  <Td>
                    <Link href={`/vehicles/${p.vehicle.id}`} className="font-medium transition-colors hover:text-primary">{p.vehicle.plateNumber} {p.vehicle.plateProvince}</Link>
                    <p className="text-xs text-muted">{p.vehicle.brand} {p.vehicle.model} · {formatKm(p.vehicle.currentOdometerKm)}</p>
                  </Td>
                  <Td className="font-medium">{p.serviceType.name}</Td>
                  <Td>{formatDate(p.nextDueAt)}<p className="text-xs text-muted">{formatKm(p.nextDueKm)}</p></Td>
                  <Td><Badge tone={s.tone} dot pulse={s.key === "overdue"}>{s.label}</Badge><p className="mt-1 text-xs text-muted">{s.detail}</p></Td>
                  <Td className="text-right">
                    {s.key === "overdue" || s.key === "soon" ? (
                      <Suspense fallback={null}>
                        <NewWorkOrderButton vehicleId={p.vehicle.id} maintenancePlanId={p.id} defaultTitle={p.serviceType.name} defaultType="PREVENTIVE" label="สร้างงาน" variant="soft" size="sm" />
                      </Suspense>
                    ) : null}
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
