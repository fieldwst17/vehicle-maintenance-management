"use client";

import { useState } from "react";
import { Info, Package, Plus, ShoppingCart } from "lucide-react";
import { addWorkOrderItem } from "@/app/actions/work-orders";
import { InlineForm } from "@/components/ui/action-form";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { PartHit } from "@/lib/query-keys";
import { PartPicker } from "./part-picker";

type Opt = { value: string; label: string };
type Source = "stock" | "buy";

/**
 * Add a line item to a work order. The fields follow the situation:
 * - in-house job + company keeps stock → parts come from stock by default (stock is deducted)
 * - outside garage, or no stock at all → parts are typed in from the garage's invoice (no stock involved)
 * - a part can always be switched between "from stock" and "bought outside" when the company keeps stock
 */
export function WorkOrderItemForm({
  workOrderId,
  serviceTypes,
  repairMode,
  inventoryEnabled,
}: {
  workOrderId: string;
  serviceTypes: Opt[];
  repairMode: "IN_HOUSE" | "EXTERNAL";
  inventoryEnabled: boolean;
}) {
  const external = repairMode === "EXTERNAL";
  const [type, setType] = useState("LABOR");
  const [source, setSource] = useState<Source>(inventoryEnabled && !external ? "stock" : "buy");
  const [part, setPart] = useState<PartHit | null>(null);
  const fromStock = type === "PART" && source === "stock";

  const typeOptions: Opt[] = [
    { value: "LABOR", label: "ค่าแรง" },
    { value: "PART", label: "อะไหล่" },
    { value: "OTHER", label: external ? "เหมาจ่าย / อื่น ๆ" : "อื่น ๆ" },
  ];

  function pickSource(next: Source) {
    setSource(next);
    setPart(null);
  }

  return (
    <div className="space-y-3">
      {external ? (
        <p className="flex items-start gap-2 rounded-xl bg-info-soft px-3 py-2 text-xs text-info">
          <Info className="mt-px size-3.5 shrink-0" />
          <span>ใส่รายการตามใบแจ้งหนี้ของอู่ทีละบรรทัด หรือเลือก “เหมาจ่าย” แล้วใส่ยอดรวมบรรทัดเดียวก็ได้</span>
        </p>
      ) : null}
      <InlineForm action={addWorkOrderItem} className="grid gap-3 rounded-2xl border border-dashed border-border bg-surface-2/50 p-4 md:grid-cols-6 md:items-end">
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <Field label="ประเภท" className="md:col-span-2">
          <Select name="itemType" options={typeOptions} value={type} onValueChange={setType} />
        </Field>

        {fromStock ? (
          <Field
            label="อะไหล่จากคลัง"
            className="md:col-span-4"
            hint={part ? `คงเหลือ ${part.stockQuantity.toLocaleString("th-TH")} ${part.unit} · ${formatMoney(part.unitCost)}/${part.unit} · จะตัดสต็อกเมื่อเพิ่มรายการ` : "เลือกอะไหล่ ระบบจะตัดสต็อกให้"}
          >
            <PartPicker name="partId" onSelect={setPart} />
          </Field>
        ) : (
          <Field label="งานบริการ" className="md:col-span-4" hint="ผูกไว้ ระบบจะเลื่อนรอบแผนบำรุงรักษาให้เมื่อปิดงาน">
            <Select name="serviceTypeId" options={serviceTypes} placeholder="— ไม่ผูกกับงานบริการ —" />
          </Field>
        )}

        {type === "PART" && inventoryEnabled ? (
          <div className="md:col-span-6">
            <div role="radiogroup" aria-label="ที่มาของอะไหล่" className="inline-flex rounded-xl border border-border bg-surface p-1 text-sm">
              {(
                [
                  { value: "stock", label: "เบิกจากคลัง", icon: Package },
                  { value: "buy", label: external ? "อู่จัดหา / ซื้อภายนอก" : "ซื้อภายนอก", icon: ShoppingCart },
                ] as const
              ).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={source === o.value}
                  onClick={() => pickSource(o.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors",
                    source === o.value ? "bg-primary-soft font-medium text-primary" : "text-muted hover:text-fg",
                  )}
                >
                  <o.icon className="size-4" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <Field label={type === "PART" && !fromStock ? "ชื่ออะไหล่ / รายละเอียด" : "รายละเอียด"} className="md:col-span-3">
          <Input
            name="description"
            required={type === "PART" && !fromStock}
            placeholder={
              fromStock ? (part ? part.name : "ว่าง = ใช้ชื่ออะไหล่")
              : type === "PART" ? "เช่น ผ้าเบรกหน้า (ตามใบเสร็จ)"
              : type === "OTHER" && external ? "เช่น ค่าซ่อมตามใบแจ้งหนี้ INV-1234"
              : "เช่น ค่าแรงเปลี่ยนน้ำมัน"
            }
          />
        </Field>
        <Field label="จำนวน" className="md:col-span-1">
          <Input name="quantity" type="number" min={0.01} step="0.01" defaultValue={1} />
        </Field>
        <Field label="ราคา/หน่วย" className="md:col-span-1">
          <Input name="unitCost" type="number" min={0} step="0.01" placeholder={fromStock ? (part ? String(part.unitCost) : "อัตโนมัติ") : "0"} />
        </Field>
        <div className="md:col-span-1">
          <SubmitButton variant="primary" className="w-full" aria-label="เพิ่มรายการ">
            <Plus />
          </SubmitButton>
        </div>
      </InlineForm>
    </div>
  );
}
