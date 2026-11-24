import { Suspense } from "react";
import { connection } from "next/server";
import { Building2, Mail, MapPin, Phone, Plus, Warehouse } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createProvider, toggleActive } from "@/app/actions/catalog";
import { ActionButton, ModalForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/data";
import { Field, FormGrid, Input, Textarea } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "อู่ / ศูนย์บริการ" };

export default function ProvidersPage() {
  return (
    <>
      <PageHeader
        icon={<Warehouse />}
        title="อู่ / ศูนย์บริการ"
        description="อู่ภายในและศูนย์บริการภายนอกที่ใช้ซ่อมรถ"
        actions={
          <ModalForm action={createProvider} triggerLabel="เพิ่มอู่" triggerIcon={<Plus />} title="เพิ่มอู่ / ศูนย์บริการ" icon={<Warehouse />} size="lg">
            <FormGrid>
              <Field label="ชื่ออู่ / ศูนย์บริการ" required className="sm:col-span-2">
                <Input name="name" required autoFocus />
              </Field>
              <Field label="ผู้ติดต่อ">
                <Input name="contactName" />
              </Field>
              <Field label="โทรศัพท์">
                <Input name="phone" type="tel" />
              </Field>
              <Field label="อีเมล">
                <Input name="email" type="email" />
              </Field>
              <Field label="เลขประจำตัวผู้เสียภาษี">
                <Input name="taxId" />
              </Field>
            </FormGrid>
            <Field label="ที่อยู่">
              <Textarea name="address" />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/40">
              <input type="checkbox" name="isInternal" className="size-4 accent-[var(--primary)]" />
              <span className="text-sm">เป็นอู่ภายในองค์กร</span>
            </label>
          </ModalForm>
        }
      />
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>}>
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  await connection();
  const rows = await prisma.serviceProvider.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { workOrders: true } } },
  });
  const spend = await prisma.workOrder.groupBy({ by: ["providerId"], where: { status: "COMPLETED", providerId: { not: null } }, _sum: { totalCost: true } });

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Warehouse />} title="ยังไม่มีอู่ในระบบ" description="เพิ่มอู่เพื่อเลือกใช้ตอนสร้างใบสั่งงาน และดูยอดใช้จ่ายของแต่ละอู่" />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((p, i) => (
        <Card key={p.id} interactive className={`animate-fade-up ${p.isActive ? "" : "opacity-60"}`}>
          <div style={{ animationDelay: `${i * 40}ms` }} className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Building2 className="size-5" /></span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">{p.contactName ?? "—"}</p>
                </div>
              </div>
              <Badge tone={p.isInternal ? "primary" : "neutral"}>{p.isInternal ? "ภายใน" : "ภายนอก"}</Badge>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              {p.phone ? <li className="flex items-center gap-2"><Phone className="size-3.5" />{p.phone}</li> : null}
              {p.email ? <li className="flex items-center gap-2 truncate"><Mail className="size-3.5" />{p.email}</li> : null}
              {p.address ? <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span className="line-clamp-2">{p.address}</span></li> : null}
            </ul>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
              <span><span className="font-semibold">{p._count.workOrders}</span> <span className="text-muted">งาน · </span><span className="font-semibold">{formatMoney(spend.find((s) => s.providerId === p.id)?._sum.totalCost)}</span></span>
              <ActionButton action={toggleActive} fields={{ kind: "provider", id: p.id, active: String(!p.isActive) }} variant="ghost">
                {p.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </ActionButton>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
