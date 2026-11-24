import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI (migrate, studio, db seed) uses the DIRECT Neon connection.
// Migrations over the pooled (-pooler / PgBouncer) URL can fail.
// The app itself connects through the pooled DATABASE_URL (see src/lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env (not env()) so `prisma generate` — which needs no DB — still works when the variable is absent,
    // e.g. during `npm install` on Vercel. migrate/studio still fail clearly without it.
    url: process.env.DATABASE_URL_UNPOOLED ?? "",
  },
});
