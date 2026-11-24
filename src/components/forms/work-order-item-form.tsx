"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addWorkOrderItem } from "@/app/actions/work-orders";
import { InlineForm } from "@/components/ui/action-form";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { itemType, options } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import type { PartHit } from "@/lib/query-keys";
import { PartPicker } from "./part-picker";

type Opt = { value: string; label: string };

/** Add a line item to a work order: the fields change with the item type (part → pick from stock) */
export function WorkOrderItemForm({ workOrderId, serviceTypes }: { workOrderId: string; serviceTypes: Opt[] }) {
  const [type, setType] = useState("LABOR");
  const [part, setPart] = useState<PartHit | null>(null);

  return (
    <InlineForm action={addWorkOrderItem} className="grid gap-3 rounded-2xl border border-dashed border-border bg-surface-2/50 p-4 md:grid-cols-6 md:items-end">
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <Field label="ประเภท" className="md:col-span-2">
        <Select name="itemType" options={options(itemType)} value={type} onValueChange={setType} />
      </Field>
      {type === "PART" ? (
        <Field
          label="อะไหล่จากสต็อก"
          className="md:col-span-4"
          hint={part ? `คงเหลือ ${part.stockQuantity.toLocaleString("th-TH")} ${part.unit} · ${formatMoney(part.unitCost)}/${part.unit}` : "ไม่เลือก = พิมพ์รายละเอียดเอง (ไม่ตัดสต็อก)"}
        >
          <PartPicker name="partId" onSelect={setPart} />
        </Field>
      ) : (
        <Field label="งานบริการ" className="md:col-span-4">
          <Select name="serviceTypeId" options={serviceTypes} placeholder="— ไม่ผูกกับงานบริการ —" />
        </Field>
      )}
      <Field label="รายละเอียด" className="md:col-span-3">
        <Input name="description" placeholder={type === "PART" ? (part ? part.name : "ว่าง = ใช้ชื่ออะไหล่") : "เช่น ค่าแรงเปลี่ยนน้ำมัน"} />
      </Field>
      <Field label="จำนวน" className="md:col-span-1">
        <Input name="quantity" type="number" min={0.01} step="0.01" defaultValue={1} />
      </Field>
      <Field label="ราคา/หน่วย" className="md:col-span-1">
        <Input name="unitCost" type="number" min={0} step="0.01" placeholder={type === "PART" ? (part ? String(part.unitCost) : "อัตโนมัติ") : "0"} />
      </Field>
      <div className="md:col-span-1">
        <SubmitButton variant="primary" className="w-full" aria-label="เพิ่มรายการ">
          <Plus />
        </SubmitButton>
      </div>
    </InlineForm>
  );
}
