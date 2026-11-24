import "dotenv/config";
import { defineConfig, env } from "prisma/config";

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
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
