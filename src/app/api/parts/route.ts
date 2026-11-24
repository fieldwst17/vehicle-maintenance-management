import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import type { PartHit } from "@/lib/query-keys";

// Part search for the work order part picker (signed-in users only; guests can't add items)
export async function GET(request: NextRequest) {
  if (!(await getCurrentUser())) return Response.json({ error: "unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const rows = await prisma.part.findMany({
    where: {
      isActive: true,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { partNumber: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { name: "asc" },
    take: 20,
    select: { id: true, name: true, partNumber: true, unit: true, unitCost: true, stockQuantity: true, reorderLevel: true },
  });

  const hits: PartHit[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    partNumber: p.partNumber,
    unit: p.unit,
    unitCost: Number(p.unitCost),
    stockQuantity: Number(p.stockQuantity),
    low: p.reorderLevel !== null && Number(p.stockQuantity) <= Number(p.reorderLevel),
  }));
  return Response.json(hits, { headers: { "cache-control": "no-store" } });
}
