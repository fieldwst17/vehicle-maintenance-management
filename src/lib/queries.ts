import "server-only";
import { prisma } from "./prisma";

// Option lists for <select> in forms
export async function vehicleOptions() {
  const rows = await prisma.vehicle.findMany({
    where: { status: { not: "RETIRED" } },
    orderBy: { plateNumber: "asc" },
    select: { id: true, plateNumber: true, plateProvince: true, brand: true, model: true },
  });
  return rows.map((v) => ({ value: v.id, label: `${v.plateNumber} ${v.plateProvince} · ${v.brand} ${v.model}` }));
}

export async function serviceTypeOptions() {
  const rows = await prisma.serviceType.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return rows.map((s) => ({ value: s.id, label: s.name }));
}

export async function providerOptions() {
  const rows = await prisma.serviceProvider.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, isInternal: true } });
  return rows.map((p) => ({ value: p.id, label: p.isInternal ? `${p.name} (ภายใน)` : p.name, isInternal: p.isInternal }));
}

export async function userOptions(roles?: ("ADMIN" | "MANAGER" | "TECHNICIAN" | "DRIVER")[]) {
  const rows = await prisma.user.findMany({
    where: { isActive: true, ...(roles ? { role: { in: roles } } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return rows.map((u) => ({ value: u.id, label: u.name }));
}
