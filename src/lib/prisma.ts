import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// The app uses the POOLED Neon URL (PgBouncer, -pooler) so serverless / many
// concurrent requests don't exhaust Postgres connections.
// Reuse one client across hot reloads in dev so connections don't leak.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// After `prisma generate` (schema change), the PrismaClient class is new → the cached instance
// fails instanceof, so it's rebuilt automatically without restarting the dev server
const cached = globalForPrisma.prisma;
export const prisma = cached instanceof PrismaClient ? cached : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
