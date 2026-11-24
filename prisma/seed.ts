import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Seeds reference data only (the service type catalog). Safe to run repeatedly (upsert).
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED! }),
});

const serviceTypes = [
  { code: "OIL_CHANGE", name: "เปลี่ยนน้ำมันเครื่อง", defaultIntervalKm: 10000, defaultIntervalMonths: 6 },
  { code: "OIL_FILTER", name: "เปลี่ยนไส้กรองน้ำมันเครื่อง", defaultIntervalKm: 10000, defaultIntervalMonths: 6 },
  { code: "AIR_FILTER", name: "เปลี่ยนไส้กรองอากาศ", defaultIntervalKm: 20000, defaultIntervalMonths: 12 },
  { code: "FUEL_FILTER", name: "เปลี่ยนไส้กรองเชื้อเพลิง", defaultIntervalKm: 40000, defaultIntervalMonths: 24 },
  { code: "CABIN_FILTER", name: "เปลี่ยนไส้กรองแอร์", defaultIntervalKm: 20000, defaultIntervalMonths: 12 },
  { code: "BRAKE_PADS", name: "ตรวจเช็ก/เปลี่ยนผ้าเบรก", defaultIntervalKm: 40000, defaultIntervalMonths: null },
  { code: "BRAKE_FLUID", name: "เปลี่ยนน้ำมันเบรก", defaultIntervalKm: 40000, defaultIntervalMonths: 24 },
  { code: "COOLANT", name: "เปลี่ยนน้ำยาหล่อเย็น", defaultIntervalKm: 40000, defaultIntervalMonths: 24 },
  { code: "TRANSMISSION_OIL", name: "เปลี่ยนน้ำมันเกียร์", defaultIntervalKm: 40000, defaultIntervalMonths: 24 },
  { code: "TIRE_ROTATION", name: "สลับยาง", defaultIntervalKm: 10000, defaultIntervalMonths: null },
  { code: "TIRE_REPLACEMENT", name: "เปลี่ยนยาง", defaultIntervalKm: 50000, defaultIntervalMonths: 48 },
  { code: "BATTERY", name: "ตรวจเช็ก/เปลี่ยนแบตเตอรี่", defaultIntervalKm: null, defaultIntervalMonths: 24 },
  { code: "GENERAL_CHECK", name: "ตรวจเช็กสภาพทั่วไป", defaultIntervalKm: 10000, defaultIntervalMonths: 6 },
];

async function main() {
  for (const s of serviceTypes) {
    await prisma.serviceType.upsert({ where: { code: s.code }, update: s, create: s });
  }
  console.log(`Seeded ${serviceTypes.length} service types`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
