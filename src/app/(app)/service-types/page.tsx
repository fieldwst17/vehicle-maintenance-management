import { Suspense } from "react";
import { connection } from "next/server";
import { Plus, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createServiceType, toggleActive } from "@/app/actions/catalog";
import { ActionButton, ModalForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Table, TableSkeleton, Td, Th, Tr } from "@/components/ui/data";
import { Field, FormGrid, Input, Textarea } from "@/components/ui/field";

export const metadata = { title: "ประเภทงานบริการ" };

export default function ServiceTypesPage() {
  return (
    <>
      <PageHeader
        icon={<Wrench />}
        title="ประเภทงานบริการ"
        description="รายการงานบำรุงรักษามาตรฐาน พร้อมรอบที่แนะนำ ใช้เป็นค่าเริ่มต้นของแผนบำรุงรักษา"
        actions={
          <ModalForm action={createServiceType} triggerLabel="เพิ่มงานบริการ" triggerIcon={<Plus />} title="เพิ่มประเภทงานบริการ" icon={<Wrench />}>
            <FormGrid>
              <Field label="รหัส" required hint="ภาษาอังกฤษ เช่น SPARK_PLUG">
                <Input name="code" required autoFocus />
              </Field>
              <Field label="ชื่องานบริการ" required>
                <Input name="name" placeholder="เช่น เปลี่ยนหัวเทียน" required />
              </Field>
              <Field label="รอบทุก ๆ (กม.)">
                <Input name="defaultIntervalKm" type="number" min={0} />
              </Field>
              <Field label="หรือทุก ๆ (เดือน)">
                <Input name="defaultIntervalMonths" type="number" min={0} />
              </Field>
            </FormGrid>
            <Field label="คำอธิบาย">
              <Textarea name="description" />
            </Field>
          </ModalForm>
        }
      />
      <Suspense fallback={<Card><TableSkeleton rows={8} /></Card>}>
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  await connection();
  const rows = await prisma.serviceType.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }], include: { _count: { select: { maintenancePlans: true } } } });
  return (
    <Card className="animate-fade-up overflow-hidden">
      {rows.length === 0 ? (
        <EmptyState icon={<Wrench />} title="ยังไม่มีงานบริการ" />
      ) : (
        <Table>
          <thead>
            <tr><Th>งานบริการ</Th><Th>รหัส</Th><Th>รอบ กม.</Th><Th>รอบเดือน</Th><Th>ใช้ในแผน</Th><Th>สถานะ</Th><Th /></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <Tr key={s.id} className={s.isActive ? "" : "opacity-55"}>
                <Td className="font-medium">{s.name}{s.description ? <p className="text-xs font-normal text-muted">{s.description}</p> : null}</Td>
                <Td className="font-mono text-xs text-muted">{s.code}</Td>
                <Td className="tabular-nums">{s.defaultIntervalKm ? s.defaultIntervalKm.toLocaleString("th-TH") : "—"}</Td>
                <Td className="tabular-nums">{s.defaultIntervalMonths ?? "—"}</Td>
                <Td className="tabular-nums">{s._count.maintenancePlans} คัน</Td>
                <Td><Badge tone={s.isActive ? "success" : "neutral"} dot>{s.isActive ? "ใช้งาน" : "ปิดใช้งาน"}</Badge></Td>
                <Td className="text-right">
                  <ActionButton action={toggleActive} fields={{ kind: "serviceType", id: s.id, active: String(!s.isActive) }} variant="ghost">
                    {s.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </ActionButton>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
