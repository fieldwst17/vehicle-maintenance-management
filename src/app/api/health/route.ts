import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

// Database health check: confirms the app can reach Neon through Prisma
export async function GET() {
  await connection(); // run on every request; do not prerender
  try {
    const [{ now }] = await prisma.$queryRaw<{ now: Date }[]>`SELECT now()`;
    const [vehicles, serviceTypes] = await Promise.all([
      prisma.vehicle.count(),
      prisma.serviceType.count(),
    ]);
    return Response.json({ status: "ok", dbTime: now, counts: { vehicles, serviceTypes } });
  } catch (error) {
    console.error("health check failed", error);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
