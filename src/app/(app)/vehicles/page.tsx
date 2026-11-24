import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Car, Gauge, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewVehicleButton } from "@/components/forms/vehicle-form";
import { LabelBadge } from "@/components/ui/badge";
import { ButtonFallback } from "@/components/ui/button-fallback";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/data";
import { FilterTabs, SearchInput } from "@/components/ui/filters";
import { formatKm } from "@/lib/format";
import { fuelType, vehicleStatus, vehicleType } from "@/lib/labels";
import type { VehicleStatus } from "@/generated/prisma/enums";

export const metadata = { title: "ยานพาหนะ" };

export default function VehiclesPage({ searchParams }: PageProps<"/vehicles">) {
  return (
    <>
      <PageHeader
        icon={<Car />}
        title="ยานพาหนะ"
        description="รายการรถทั้งหมด พร้อมสถานะและเลขไมล์ล่าสุด"
        actions={
          <Suspense fallback={<ButtonFallback label="เพิ่มรถ" />}>
            <NewVehicleButton />
          </Suspense>
        }
      />
      <Suspense fallback={<GridSkeleton />}>
        <VehicleGrid searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  );
}

async function VehicleGrid({ searchParams }: { searchParams: PageProps<"/vehicles">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && sp.status in vehicleStatus ? (sp.status as VehicleStatus) : undefined;

  const where = q
    ? { OR: ["plateNumber", "brand", "model", "vin"].map((f) => ({ [f]: { contains: q, mode: "insensitive" as const } })) }
    : {};

  const [vehicles, counts] = await Promise.all([
    prisma.vehicle.findMany({
      where: { ...where, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        assignedDriver: { select: { name: true } },
        _count: { select: { workOrders: { where: { status: { in: ["DRAFT", "SCHEDULED", "IN_PROGRESS", "ON_HOLD"] } } } } },
      },
    }),
    prisma.vehicle.groupBy({ by: ["status"], where, _count: true }),
  ]);
  const countOf = (s?: VehicleStatus) => (s ? counts.find((c) => c.status === s)?._count ?? 0 : counts.reduce((a, c) => a + c._count, 0));

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          param="status"
          options={[
            { value: "", label: "ทั้งหมด", count: countOf() },
            ...(Object.keys(vehicleStatus) as VehicleStatus[]).map((s) => ({ value: s, label: vehicleStatus[s].label, count: countOf(s) })),
          ]}
        />
        <SearchInput placeholder="ค้นหาทะเบียน ยี่ห้อ รุ่น…" />
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Car />}
            title={q || status ? "ไม่พบรถที่ตรงกับเงื่อนไข" : "ยังไม่มีรถในระบบ"}
            description={q || status ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เริ่มต้นด้วยการเพิ่มรถคันแรกของคุณ"}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v, i) => (
            <Link
              key={v.id}
              href={`/vehicles/${v.id}`}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-300 animate-fade-up hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-gradient-to-br from-primary/10 to-transparent transition-transform duration-500 group-hover:scale-150" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* License-plate style */}
                  <div className="inline-flex flex-col items-center rounded-lg border-2 border-fg/80 bg-white px-3 py-0.5 text-black shadow-sm">
                    <span className="text-lg font-bold leading-tight tracking-wide">{v.plateNumber}</span>
                    <span className="text-[10px] leading-tight">{v.plateProvince}</span>
                  </div>
                  <p className="mt-3 truncate font-semibold group-hover:text-primary">{v.brand} {v.model}</p>
                  <p className="text-xs text-muted">
                    {vehicleType[v.type].label} · {fuelType[v.fuelType].label}
                    {v.year ? ` · ${v.year}` : ""}
                  </p>
                </div>
                <LabelBadge entry={vehicleStatus[v.status]} pulse={v.status === "IN_MAINTENANCE"} />
              </div>
              <div className="relative mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                <div className="flex items-center gap-4 text-muted">
                  <span className="flex items-center gap-1.5"><Gauge className="size-4" />{formatKm(v.currentOdometerKm)}</span>
                  {v.assignedDriver ? <span className="flex items-center gap-1.5 truncate"><UserRound className="size-4" />{v.assignedDriver.name}</span> : null}
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  {v._count.workOrders ? `${v._count.workOrders} งานเปิด` : ""}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
