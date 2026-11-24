import { connection } from "next/server";
import { CarFront, Plus } from "lucide-react";
import { createVehicle } from "@/app/actions/vehicles";
import { ModalForm } from "@/components/ui/action-form";
import { Field, FormGrid, Input, Select, Textarea } from "@/components/ui/field";
import { fuelType, options, vehicleType } from "@/lib/labels";
import { userOptions } from "@/lib/queries";
import type { ButtonVariant } from "@/components/ui/button-styles";

/** "Add vehicle" button + form (loads the driver list itself) */
export async function NewVehicleButton({ variant = "primary" }: { variant?: ButtonVariant }) {
  await connection(); // runs per request (inside Suspense)
  const drivers = await userOptions(["DRIVER", "MANAGER"]);
  return (
    <ModalForm
      action={createVehicle}
      triggerLabel="เพิ่มรถ"
      triggerIcon={<Plus />}
      triggerVariant={variant}
      title="เพิ่มยานพาหนะ"
      description="กรอกข้อมูลรถเพื่อเริ่มติดตามการซ่อมบำรุง"
      icon={<CarFront />}
      submitLabel="เพิ่มรถ"
      size="lg"
    >
      <FormGrid>
        <Field label="ทะเบียนรถ" required>
          <Input name="plateNumber" placeholder="เช่น 1กข 1234" required autoFocus />
        </Field>
        <Field label="จังหวัด" required>
          <Input name="plateProvince" placeholder="เช่น กรุงเทพมหานคร" required />
        </Field>
        <Field label="ยี่ห้อ" required>
          <Input name="brand" placeholder="เช่น Toyota" required />
        </Field>
        <Field label="รุ่น" required>
          <Input name="model" placeholder="เช่น Hilux Revo" required />
        </Field>
        <Field label="ประเภทรถ">
          <Select name="type" options={options(vehicleType)} defaultValue="PICKUP" />
        </Field>
        <Field label="เชื้อเพลิง">
          <Select name="fuelType" options={options(fuelType)} defaultValue="DIESEL" />
        </Field>
        <Field label="ปีรถ">
          <Input name="year" type="number" min={1950} max={2100} placeholder="2024" />
        </Field>
        <Field label="สี">
          <Input name="color" placeholder="เช่น ขาว" />
        </Field>
        <Field label="เลขไมล์ปัจจุบัน (กม.)">
          <Input name="currentOdometerKm" type="number" min={0} placeholder="0" />
        </Field>
        <Field label="วันที่ซื้อ">
          <Input name="purchaseDate" type="date" />
        </Field>
        <Field label="เลขตัวถัง (VIN)">
          <Input name="vin" placeholder="ไม่บังคับ" />
        </Field>
        <Field label="คนขับประจำ">
          <Select name="assignedDriverId" options={drivers} placeholder="— ไม่ระบุ —" />
        </Field>
      </FormGrid>
      <Field label="หมายเหตุ">
        <Textarea name="notes" placeholder="ข้อมูลเพิ่มเติม" />
      </Field>
    </ModalForm>
  );
}
