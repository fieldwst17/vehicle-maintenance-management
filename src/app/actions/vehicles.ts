"use server";

import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";
import { date, decimal, FormError, int, oneOf, str } from "@/lib/form";
import { computeNextDue } from "@/lib/maintenance";
import { DocumentType, FuelType, VehicleStatus, VehicleType } from "@/generated/prisma/enums";
import { run } from "./run";

export async function createVehicle(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const odometer = int(fd, "currentOdometerKm", "เลขไมล์") ?? 0;
    const v = await prisma.vehicle.create({
      data: {
        plateNumber: str(fd, "plateNumber", "ทะเบียนรถ", true),
        plateProvince: str(fd, "plateProvince", "จังหวัด", true),
        brand: str(fd, "brand", "ยี่ห้อ", true),
        model: str(fd, "model", "รุ่น", true),
        year: int(fd, "year", "ปีรถ"),
        color: str(fd, "color"),
        vin: str(fd, "vin"),
        type: oneOf(fd, "type", Object.values(VehicleType)),
        fuelType: oneOf(fd, "fuelType", Object.values(FuelType)),
        currentOdometerKm: odometer,
        purchaseDate: date(fd, "purchaseDate", "วันที่ซื้อ"),
        assignedDriverId: str(fd, "assignedDriverId"),
        notes: str(fd, "notes"),
        odometerReadings: odometer > 0 ? { create: { readingKm: odometer } } : undefined,
      },
    });
    return `เพิ่มรถทะเบียน ${v.plateNumber} เรียบร้อย`;
  }, "ทะเบียนรถหรือเลขตัวถังนี้มีอยู่แล้ว");
}

export async function updateVehicleStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const status = oneOf(fd, "status", Object.values(VehicleStatus));
    if (!status) throw new FormError("สถานะไม่ถูกต้อง");
    await prisma.vehicle.update({ where: { id: str(fd, "vehicleId", "รถ", true) }, data: { status } });
    return "อัปเดตสถานะรถแล้ว";
  });
}

export async function recordOdometer(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const vehicleId = str(fd, "vehicleId", "รถ", true);
    const readingKm = int(fd, "readingKm", "เลขไมล์", true)!;
    const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId }, select: { currentOdometerKm: true } });
    if (readingKm < vehicle.currentOdometerKm) {
      throw new FormError(`เลขไมล์ต้องไม่น้อยกว่าค่าล่าสุด (${vehicle.currentOdometerKm.toLocaleString("th-TH")} กม.)`);
    }
    await prisma.$transaction([
      prisma.odometerReading.create({ data: { vehicleId, readingKm } }),
      prisma.vehicle.update({ where: { id: vehicleId }, data: { currentOdometerKm: readingKm } }),
    ]);
    return `บันทึกเลขไมล์ ${readingKm.toLocaleString("th-TH")} กม. แล้ว`;
  });
}

export async function addVehicleDocument(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const type = oneOf(fd, "type", Object.values(DocumentType));
    if (!type) throw new FormError("กรุณาเลือกประเภทเอกสาร");
    await prisma.vehicleDocument.create({
      data: {
        vehicleId: str(fd, "vehicleId", "รถ", true),
        type,
        documentNumber: str(fd, "documentNumber"),
        provider: str(fd, "provider"),
        issueDate: date(fd, "issueDate", "วันที่ออก"),
        expiryDate: date(fd, "expiryDate", "วันหมดอายุ"),
        cost: decimal(fd, "cost", "ค่าใช้จ่าย"),
      },
    });
    return "เพิ่มเอกสารแล้ว";
  });
}

export async function addMaintenancePlan(_: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const vehicleId = str(fd, "vehicleId", "รถ", true);
    const serviceTypeId = str(fd, "serviceTypeId", "ประเภทงานบริการ", true);
    const [vehicle, serviceType] = await Promise.all([
      prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId }, select: { currentOdometerKm: true } }),
      prisma.serviceType.findUniqueOrThrow({ where: { id: serviceTypeId } }),
    ]);
    const intervalKm = int(fd, "intervalKm", "ระยะ กม.") ?? serviceType.defaultIntervalKm;
    const intervalMonths = int(fd, "intervalMonths", "ระยะเดือน") ?? serviceType.defaultIntervalMonths;
    if (!intervalKm && !intervalMonths) throw new FormError("กรุณากำหนดรอบเป็น กม. หรือ เดือน อย่างน้อยหนึ่งอย่าง");

    const lastServiceAt = date(fd, "lastServiceAt", "วันที่เข้ารับบริการล่าสุด") ?? new Date();
    const lastServiceKm = int(fd, "lastServiceKm", "เลขไมล์ครั้งล่าสุด") ?? vehicle.currentOdometerKm;
    const next = computeNextDue({ lastAt: lastServiceAt, lastKm: lastServiceKm, intervalKm, intervalMonths });

    await prisma.maintenancePlan.create({
      data: { vehicleId, serviceTypeId, intervalKm, intervalMonths, lastServiceAt, lastServiceKm, ...next },
    });
    return `เพิ่มแผน "${serviceType.name}" แล้ว`;
  }, "รถคันนี้มีแผนสำหรับงานบริการนี้อยู่แล้ว");
}
