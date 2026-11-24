import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, ArrowRight, CalendarClock, Car, ClipboardList, FileWarning, LayoutDashboard, Wallet, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewVehicleButton } from "@/components/forms/vehicle-form";
import { NewWorkOrderButton } from "@/components/forms/work-order-form";
import { Badge, LabelBadge } from "@/components/ui/badge";
import { ButtonFallback } from "@/components/ui/button-fallback";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, Skeleton, StatCard, TableSkeleton } from "@/components/ui/data";
import { daysFromNow, daysUntil, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { documentType, workOrderStatus } from "@/lib/labels";
import { dueState } from "@/lib/maintenance";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        icon={<LayoutDashboard />}
        title="แดชบอร์ด"
        description="ภาพรวมสถานะยานพาหนะและงานซ่อมบำรุงทั้งหมด"
        actions={
          <Suspense fallback={<ButtonFallback label="สร้างใบสั่งงาน" />}>
            <NewVehicleButton variant="secondary" />
            <NewWorkOrderButton />
          </Suspense>
        }
      />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Suspense fallback={<Card><TableSkeleton /></Card>}>
            <DuePlans />
          </Suspense>
        </div>
        <div className="xl:col-span-2">
          <Suspense fallback={<Card><TableSkeleton rows={4} /></Card>}>
            <ExpiringDocuments />
          </Suspense>
        </div>
      </div>
      <div className="mt-6">
        <Suspense fallback={<Card><TableSkeleton /></Card>}>
          <RecentWorkOrders />
        </Suspense>
      </div>
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[118px] rounded-2xl" />
      ))}
    </div>
  );
}

async function Stats() {
  await connection();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [vehicles, inMaintenance, openOrders, criticalOrders, monthCost] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: "RETIRED" } } }),
    prisma.vehicle.count({ where: { status: "IN_MAINTENANCE" } }),
    prisma.workOrder.count({ where: { status: { in: ["DRAFT", "SCHEDULED", "IN_PROGRESS", "ON_HOLD"] } } }),
    prisma.workOrder.count({ where: { status: { in: ["DRAFT", "SCHEDULED", "IN_PROGRESS", "ON_HOLD"] }, priority: "CRITICAL" } }),
    prisma.workOrder.aggregate({ _sum: { totalCost: true }, where: { status: "COMPLETED", completedAt: { gte: monthStart } } }),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="ยานพาหนะทั้งหมด" value={formatNumber(vehicles)} hint="ไม่รวมรถที่ปลดระวาง" icon={<Car />} accent="primary" />
      <StatCard label="กำลังซ่อม" value={formatNumber(inMaintenance)} hint={vehicles ? `${Math.round((inMaintenance / vehicles) * 100)}% ของรถทั้งหมด` : "—"} icon={<Wrench />} accent="warning" delay={60} />
      <StatCard label="ใบสั่งงานที่เปิดอยู่" value={formatNumber(openOrders)} hint={criticalOrders ? `เร่งด่วน ${criticalOrders} งาน` : "ไม่มีงานเร่งด่วน"} icon={<ClipboardList />} accent="info" delay={120} />
      <StatCard label="ค่าซ่อมเดือนนี้" value={formatMoney(monthCost._sum.totalCost)} hint="จากงานที่ปิดแล้ว" icon={<Wallet />} accent="success" delay={180} />
    </div>
  );
}

async function DuePlans() {
  await connection();
  const plans = await prisma.maintenancePlan.findMany({
    where: { isActive: true, vehicle: { status: { not: "RETIRED" } } },
    include: { vehicle: { select: { id: true, plateNumber: true, plateProvince: true, currentOdometerKm: true } }, serviceType: { select: { name: true } } },
  });
  const due = plans
    .map((p) => ({ p, s: dueState(p, p.vehicle.currentOdometerKm) }))
    .filter(({ s }) => s.key === "overdue" || s.key === "soon")
    .sort((a, b) => (a.s.key === b.s.key ? 0 : a.s.key === "overdue" ? -1 : 1))
    .slice(0, 6);

  return (
    <Card className="h-full animate-fade-up">
      <CardHeader
        icon={<CalendarClock />}
        title="ถึงกำหนดบำรุงรักษา"
        description="เลยกำหนด หรือเหลือไม่เกิน 1,000 กม. / 14 วัน"
        action={<ButtonLink href="/maintenance" variant="ghost" size="sm">ดูทั้งหมด <ArrowRight /></ButtonLink>}
      />
      {due.length === 0 ? (
        <EmptyState icon={<CalendarClock />} title="ยังไม่มีรายการที่ถึงกำหนด" description="เพิ่มแผนบำรุงรักษาได้ในหน้ารายละเอียดรถแต่ละคัน" />
      ) : (
        <ul className="divide-y divide-border">
          {due.map(({ p, s }) => (
            <li key={p.id}>
              <Link href={`/vehicles/${p.vehicle.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-primary-soft/40">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${s.key === "overdue" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                  <AlertTriangle className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.serviceType.name}</p>
                  <p className="truncate text-xs text-muted">{p.vehicle.plateNumber} {p.vehicle.plateProvince} · {s.detail}</p>
                </div>
                <Badge tone={s.tone} dot pulse={s.key === "overdue"}>{s.label}</Badge>
                <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

async function ExpiringDocuments() {
  await connection();
  const in30 = daysFromNow(30);
  const docs = await prisma.vehicleDocument.findMany({
    where: { expiryDate: { lte: in30 }, vehicle: { status: { not: "RETIRED" } } },
    orderBy: { expiryDate: "asc" },
    take: 6,
    include: { vehicle: { select: { id: true, plateNumber: true } } },
  });

  return (
    <Card className="h-full animate-fade-up">
      <CardHeader icon={<FileWarning />} title="เอกสารใกล้หมดอายุ" description="ภาษี / พ.ร.บ. / ประกัน ภายใน 30 วัน" />
      {docs.length === 0 ? (
        <EmptyState icon={<FileWarning />} title="ไม่มีเอกสารใกล้หมดอายุ" description="เอกสารทั้งหมดยังอยู่ในระยะเวลาที่ใช้ได้" />
      ) : (
        <ul className="divide-y divide-border">
          {docs.map((d) => {
            const days = daysUntil(d.expiryDate!);
            return (
              <li key={d.id}>
                <Link href={`/vehicles/${d.vehicle.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-primary-soft/40">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{documentType[d.type].label} · {d.vehicle.plateNumber}</p>
                    <p className="text-xs text-muted">หมดอายุ {formatDate(d.expiryDate)}</p>
                  </div>
                  <Badge tone={days < 0 ? "danger" : days <= 7 ? "warning" : "info"}>{days < 0 ? `หมดแล้ว ${-days} วัน` : `อีก ${days} วัน`}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

async function RecentWorkOrders() {
  await connection();
  const orders = await prisma.workOrder.findMany({
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
  });

  return (
    <Card className="animate-fade-up">
      <CardHeader
        icon={<ClipboardList />}
        title="ใบสั่งงานล่าสุด"
        action={<ButtonLink href="/work-orders" variant="ghost" size="sm">ดูทั้งหมด <ArrowRight /></ButtonLink>}
      />
      {orders.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="ยังไม่มีใบสั่งงาน" description="สร้างใบสั่งงานแรกเพื่อเริ่มบันทึกประวัติการซ่อม" />
      ) : (
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o, i) => (
            <Link
              key={o.id}
              href={`/work-orders/${o.id}`}
              style={{ animationDelay: `${i * 50}ms` }}
              className="group rounded-2xl border border-border bg-surface-2/50 p-4 transition-all duration-300 animate-fade-up hover:-translate-y-1 hover:border-primary/30 hover:bg-surface hover:shadow-lift"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted">{o.code}</span>
                <LabelBadge entry={workOrderStatus[o.status]} pulse={o.status === "IN_PROGRESS"} />
              </div>
              <p className="mt-3 truncate font-medium group-hover:text-primary">{o.title}</p>
              <p className="mt-1 truncate text-xs text-muted">{o.vehicle.plateNumber} · {o.vehicle.brand} {o.vehicle.model}</p>
              <p className="mt-3 text-sm font-semibold tabular-nums">{formatMoney(o.totalCost)}</p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
