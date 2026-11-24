import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, VehicleType, FuelType } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";

const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });

export async function GET() {
  await connection(); // run on every request; do not prerender
  if (!(await getCurrentUser())) return unauthorized();
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      plateNumber: true,
      plateProvince: true,
      brand: true,
      model: true,
      year: true,
      type: true,
      status: true,
      currentOdometerKm: true,
    },
  });
  return Response.json({ data: vehicles });
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plateNumber, plateProvince, brand, model } = body;
  if (
    typeof plateNumber !== "string" || !plateNumber.trim() ||
    typeof plateProvince !== "string" || !plateProvince.trim() ||
    typeof brand !== "string" || !brand.trim() ||
    typeof model !== "string" || !model.trim()
  ) {
    return Response.json(
      { error: "plateNumber, plateProvince, brand and model are required" },
      { status: 400 },
    );
  }

  const type = Object.values(VehicleType).includes(body.type as VehicleType)
    ? (body.type as VehicleType)
    : undefined;
  const fuelType = Object.values(FuelType).includes(body.fuelType as FuelType)
    ? (body.fuelType as FuelType)
    : undefined;
  const year = Number.isInteger(body.year) ? (body.year as number) : undefined;
  const odometer = Number.isInteger(body.currentOdometerKm)
    ? (body.currentOdometerKm as number)
    : 0;

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: plateNumber.trim(),
        plateProvince: plateProvince.trim(),
        brand: brand.trim(),
        model: model.trim(),
        year,
        type,
        fuelType,
        currentOdometerKm: odometer,
        // Record the first mileage reading alongside the vehicle
        odometerReadings: odometer > 0 ? { create: { readingKm: odometer } } : undefined,
      },
    });
    return Response.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "A vehicle with this plate already exists" }, { status: 409 });
    }
    throw error;
  }
}
