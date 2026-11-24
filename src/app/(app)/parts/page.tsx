import { Suspense } from "react";
import { connection } from "next/server";
import { Minus, Package, PackagePlus, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { adjustStock, createPart, toggleActive } from "@/app/actions/catalog";
import { ActionButton, InlineForm, ModalForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard, Table, TableSkeleton, Td, Th, Tr } from "@/components/ui/data";
import { Field, FormGrid, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatMoney, formatNumber, toNumber } from "@/lib/format";

export const metadata = { title: "อะไหล่ & สต็อก" };

export default function PartsPage() {
  return (
    <>
      <PageHeader
        icon={<Package />}
        title="อะไหล่ & สต็อก"
        description="อะไหล่ที่ใช้ในใบสั่งงานจะถูกตัดสต็อกอัตโนมัติ"
        actions={
          <ModalForm action={createPart} triggerLabel="เพิ่มอะไหล่" triggerIcon={<Plus />} title="เพิ่มอะไหล่" icon={<PackagePlus />}>
            <FormGrid>
              <Field label="รหัสอะไหล่" required>
                <Input name="partNumber" required autoFocus />
              </Field>
              <Field label="ชื่ออะไหล่" required>
                <Input name="name" placeholder="เช่น น้ำมันเครื่อง 5W-30" required />
              </Field>
              <Field label="หน่วย">
                <Input name="unit" placeholder="ชิ้น / ลิตร / ชุด" defaultValue="ชิ้น" />
              </Field>
              <Field label="ราคาต่อหน่วย (บาท)">
                <Input name="unitCost" type="number" min={0} step="0.01" />
              </Field>
              <Field label="จำนวนคงเหลือเริ่มต้น">
                <Input name="stockQuantity" type="number" min={0} step="0.01" />
              </Field>
              <Field label="จุดสั่งซื้อ" hint="เตือนเมื่อสต็อกต่ำกว่าค่านี้">
                <Input name="reorderLevel" type="number" min={0} step="0.01" />
              </Field>
            </FormGrid>
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
  const parts = await prisma.part.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  const low = parts.filter((p) => p.isActive && p.reorderLevel !== null && toNumber(p.stockQuantity) <= toNumber(p.reorderLevel));
  const stockValue = parts.reduce((a, p) => a + toNumber(p.stockQuantity) * toNumber(p.unitCost), 0);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="รายการอะไหล่" value={formatNumber(parts.length)} icon={<Package />} />
        <StatCard label="ต่ำกว่าจุดสั่งซื้อ" value={formatNumber(low.length)} icon={<Minus />} accent={low.length ? "danger" : "success"} delay={60} />
        <StatCard label="มูลค่าสต็อก" value={formatMoney(stockValue)} icon={<PackagePlus />} accent="info" delay={120} />
      </div>
      <Card className="animate-fade-up overflow-hidden">
        {parts.length === 0 ? (
          <EmptyState icon={<Package />} title="ยังไม่มีอะไหล่ในระบบ" />
        ) : (
          <Table>
            <thead>
              <tr><Th>อะไหล่</Th><Th className="text-right">ราคา/หน่วย</Th><Th className="text-right">คงเหลือ</Th><Th>ปรับสต็อก</Th><Th /></tr>
            </thead>
            <tbody>
              {parts.map((p) => {
                const isLow = low.includes(p);
                return (
                  <Tr key={p.id} className={p.isActive ? "" : "opacity-55"}>
                    <Td>
                      <p className="font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-muted">{p.partNumber}</p>
                    </Td>
                    <Td className="text-right tabular-nums">{formatMoney(p.unitCost)}</Td>
                    <Td className="text-right">
                      <span className="font-semibold tabular-nums">{formatNumber(p.stockQuantity)}</span> <span className="text-xs text-muted">{p.unit}</span>
                      {isLow ? <div className="mt-1"><Badge tone="danger" dot pulse>ใกล้หมด</Badge></div> : null}
                    </Td>
                    <Td>
                      <InlineForm action={adjustStock} className="flex items-center gap-2">
                        <input type="hidden" name="partId" value={p.id} />
                        <Input name="delta" type="number" step="0.01" placeholder="+10 / -2" required className="h-8 w-28" />
                        <SubmitButton variant="soft" size="sm">ปรับ</SubmitButton>
                      </InlineForm>
                    </Td>
                    <Td className="text-right">
                      <ActionButton action={toggleActive} fields={{ kind: "part", id: p.id, active: String(!p.isActive) }} variant="ghost">
                        {p.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </ActionButton>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
