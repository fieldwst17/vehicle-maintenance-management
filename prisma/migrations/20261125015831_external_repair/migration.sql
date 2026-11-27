-- CreateEnum
CREATE TYPE "RepairMode" AS ENUM ('IN_HOUSE', 'EXTERNAL');

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "invoiceDate" DATE,
ADD COLUMN     "repairMode" "RepairMode" NOT NULL DEFAULT 'IN_HOUSE';

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "inventoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requireInvoiceForExternal" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- Backfill: jobs already sent to an outside garage
UPDATE "work_orders" w SET "repairMode" = 'EXTERNAL'
FROM "service_providers" p
WHERE w."providerId" = p."id" AND p."isInternal" = false;
