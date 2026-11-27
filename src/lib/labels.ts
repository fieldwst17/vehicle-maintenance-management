// Thai labels and badge tones for every enum, used everywhere for consistent display
import type {
  CostApprovalStatus,
  DocumentType,
  FuelType,
  OdometerSource,
  Priority,
  RepairMode,
  UserRole,
  VehicleStatus,
  VehicleType,
  WorkOrderItemType,
  WorkOrderStatus,
  WorkOrderType,
} from "@/generated/prisma/enums";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

type LabelMap<T extends string> = Record<T, { label: string; tone: Tone }>;

export const vehicleStatus: LabelMap<VehicleStatus> = {
  ACTIVE: { label: "พร้อมใช้งาน", tone: "success" },
  IN_MAINTENANCE: { label: "กำลังซ่อม", tone: "warning" },
  INACTIVE: { label: "พักใช้งาน", tone: "neutral" },
  RETIRED: { label: "ปลดระวาง", tone: "danger" },
};

export const vehicleType: LabelMap<VehicleType> = {
  CAR: { label: "รถเก๋ง", tone: "neutral" },
  PICKUP: { label: "รถกระบะ", tone: "neutral" },
  VAN: { label: "รถตู้", tone: "neutral" },
  TRUCK: { label: "รถบรรทุก", tone: "neutral" },
  BUS: { label: "รถบัส", tone: "neutral" },
  MOTORCYCLE: { label: "รถจักรยานยนต์", tone: "neutral" },
  OTHER: { label: "อื่น ๆ", tone: "neutral" },
};

export const fuelType: LabelMap<FuelType> = {
  GASOLINE: { label: "เบนซิน", tone: "neutral" },
  DIESEL: { label: "ดีเซล", tone: "neutral" },
  HYBRID: { label: "ไฮบริด", tone: "neutral" },
  ELECTRIC: { label: "ไฟฟ้า", tone: "neutral" },
  LPG: { label: "LPG", tone: "neutral" },
  NGV: { label: "NGV", tone: "neutral" },
  OTHER: { label: "อื่น ๆ", tone: "neutral" },
};

export const workOrderStatus: LabelMap<WorkOrderStatus> = {
  DRAFT: { label: "แจ้งปัญหา", tone: "neutral" },
  SCHEDULED: { label: "นัดหมายแล้ว", tone: "info" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", tone: "warning" },
  ON_HOLD: { label: "รออะไหล่/อนุมัติ", tone: "primary" },
  COMPLETED: { label: "เสร็จสิ้น", tone: "success" },
  CANCELLED: { label: "ยกเลิก", tone: "danger" },
};

export const approvalStatus: LabelMap<CostApprovalStatus> = {
  PENDING: { label: "รออนุมัติ", tone: "warning" },
  APPROVED: { label: "อนุมัติแล้ว", tone: "success" },
  REJECTED: { label: "ไม่อนุมัติ", tone: "danger" },
};

export const workOrderType: LabelMap<WorkOrderType> = {
  PREVENTIVE: { label: "บำรุงรักษาตามระยะ", tone: "info" },
  CORRECTIVE: { label: "ซ่อมแก้ไข", tone: "warning" },
  INSPECTION: { label: "ตรวจสภาพ", tone: "neutral" },
  ACCIDENT: { label: "อุบัติเหตุ", tone: "danger" },
};

export const priority: LabelMap<Priority> = {
  LOW: { label: "ต่ำ", tone: "neutral" },
  MEDIUM: { label: "ปานกลาง", tone: "info" },
  HIGH: { label: "สูง", tone: "warning" },
  CRITICAL: { label: "เร่งด่วน", tone: "danger" },
};

export const itemType: LabelMap<WorkOrderItemType> = {
  LABOR: { label: "ค่าแรง", tone: "info" },
  PART: { label: "อะไหล่", tone: "primary" },
  OTHER: { label: "อื่น ๆ", tone: "neutral" },
};

export const documentType: LabelMap<DocumentType> = {
  REGISTRATION: { label: "เล่มทะเบียน", tone: "neutral" },
  ANNUAL_TAX: { label: "ภาษีประจำปี", tone: "info" },
  COMPULSORY_INSURANCE: { label: "พ.ร.บ.", tone: "primary" },
  VOLUNTARY_INSURANCE: { label: "ประกันภัย", tone: "success" },
  INSPECTION: { label: "ตรวจสภาพรถ", tone: "warning" },
  OTHER: { label: "อื่น ๆ", tone: "neutral" },
};

export const userRole: LabelMap<UserRole> = {
  ADMIN: { label: "ผู้ดูแลระบบ", tone: "danger" },
  MANAGER: { label: "ผู้จัดการยานพาหนะ", tone: "primary" },
  TECHNICIAN: { label: "ช่างซ่อม", tone: "info" },
  DRIVER: { label: "พนักงานขับรถ", tone: "neutral" },
};

export const odometerSource: LabelMap<OdometerSource> = {
  MANUAL: { label: "บันทึกเอง", tone: "neutral" },
  WORK_ORDER: { label: "จากใบสั่งงาน", tone: "info" },
  GPS: { label: "GPS", tone: "success" },
};

/** Turns a label map into <option> entries */
export function options<T extends string>(map: LabelMap<T>) {
  return (Object.keys(map) as T[]).map((value) => ({ value, label: map[value].label }));
}

export const repairMode: LabelMap<RepairMode> = {
  IN_HOUSE: { label: "ซ่อมเอง", tone: "primary" },
  EXTERNAL: { label: "ส่งอู่ภายนอก", tone: "info" },
};
