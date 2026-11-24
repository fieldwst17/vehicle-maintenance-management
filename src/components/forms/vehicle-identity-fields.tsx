"use client";

import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import { THAI_PROVINCES } from "@/lib/data/provinces";
import { VEHICLE_BRANDS, VEHICLE_MODELS } from "@/lib/data/vehicle-models";

/** Province / brand / model pickers: the model list follows the chosen brand */
export function VehicleIdentityFields() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const brandKey = VEHICLE_BRANDS.find((b) => b.toLowerCase() === brand.trim().toLowerCase());
  const models = brandKey ? VEHICLE_MODELS[brandKey] : [];

  return (
    <>
      <Field label="จังหวัด" required>
        <Combobox name="plateProvince" options={THAI_PROVINCES} placeholder="เลือกหรือพิมพ์ค้นหา" required allowCustom={false} emptyText="ไม่พบจังหวัดนี้" />
      </Field>
      <Field label="ยี่ห้อ" required>
        <Combobox
          name="brand"
          options={VEHICLE_BRANDS}
          value={brand}
          onChange={(v) => {
            // Brand changed → the previous model no longer applies
            if (v !== brand) setModel("");
            setBrand(v);
          }}
          placeholder="เลือกหรือพิมพ์ เช่น Toyota"
          required
        />
      </Field>
      <Field label="รุ่น" required hint={brand && !brandKey ? "ยี่ห้อนี้ไม่มีในรายการ พิมพ์รุ่นเองได้เลย" : undefined}>
        <Combobox
          name="model"
          options={models}
          value={model}
          onChange={setModel}
          placeholder={brand ? "เลือกหรือพิมพ์รุ่น" : "เลือกยี่ห้อก่อน"}
          emptyText="พิมพ์ชื่อรุ่นได้เลย"
          required
        />
      </Field>
    </>
  );
}
