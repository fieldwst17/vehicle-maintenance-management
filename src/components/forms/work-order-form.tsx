import { connection } from "next/server";
import { ClipboardPlus, Plus } from "lucide-react";
import { createWorkOrder } from "@/app/actions/work-orders";
import { ModalForm } from "@/components/ui/action-form";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/ui/field";
import type { ButtonVariant } from "@/components/ui/button-styles";
import { options, priority, workOrderType } from "@/lib/labels";
import { providerOptions, userOptions, vehicleOptions } from "@/lib/queries";

/** "Create work order" button + form; pass vehicleId to lock it to one vehicle */
export async function NewWorkOrderButton({
  vehicleId,
  maintenancePlanId,
  defaultTitle,
  defaultType,
  label = "สร้างใบสั่งงาน",
  variant = "primary",
  size,
}: {
  vehicleId?: string;
  maintenancePlanId?: string;
  defaultTitle?: string;
  defaultType?: string;
  label?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  await connection(); // runs per request (inside Suspense)
  const [vehicles, providers, technicians] = await Promise.all([vehicleOptions(), providerOptions(), userOptions(["TECHNICIAN", "MANAGER"])]);

  return (
    <ModalForm
      action={createWorkOrder}
      triggerLabel={label}
      triggerIcon={<Plus />}
      triggerVariant={variant}
      triggerSize={size}
      title="สร้างใบสั่งงานซ่อม"
      description="ระบบจะออกเลขใบสั่งงานให้อัตโนมัติ"
      icon={<ClipboardPlus />}
      submitLabel="สร้างใบสั่งงาน"
      size="lg"
    >
      {maintenancePlanId ? <input type="hidden" name="maintenancePlanId" value={maintenancePlanId} /> : null}
      <Field label="รถ" required>
        <Select name="vehicleId" options={vehicles} placeholder="— เลือกรถ —" defaultValue={vehicleId ?? ""} required />
      </Field>
      <Field label="หัวข้องาน" required>
        <Input name="title" placeholder="เช่น เปลี่ยนน้ำมันเครื่อง / เบรกมีเสียงดัง" defaultValue={defaultTitle} required autoFocus />
      </Field>
      <FormGrid>
        <Field label="ประเภทงาน">
          <Select name="type" options={options(workOrderType)} defaultValue={defaultType ?? "CORRECTIVE"} />
        </Field>
        <Field label="ความเร่งด่วน">
          <Select name="priority" options={options(priority)} defaultValue="MEDIUM" />
        </Field>
        <Field label="วันนัดหมาย" hint="ใส่วันนัดเพื่อตั้งสถานะเป็น นัดหมายแล้ว">
          <Input name="scheduledAt" type="datetime-local" />
        </Field>
        <Field label="เลขไมล์ขณะเข้ารับบริการ">
          <Input name="odometerKm" type="number" min={0} placeholder="กม." />
        </Field>
        <Field label="อู่ / ศูนย์บริการ">
          <Select name="providerId" options={providers} placeholder="— ไม่ระบุ —" />
        </Field>
        <Field label="ผู้รับผิดชอบ">
          <Select name="assignedToId" options={technicians} placeholder="— ไม่ระบุ —" />
        </Field>
      </FormGrid>
      <Field label="อาการ / รายละเอียด">
        <Textarea name="description" placeholder="อธิบายอาการหรือสิ่งที่ต้องทำ" />
      </Field>
    </ModalForm>
  );
}
