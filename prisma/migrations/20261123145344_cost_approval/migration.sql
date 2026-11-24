-- CreateEnum
CREATE TYPE "CostApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "approvalNote" TEXT,
ADD COLUMN     "approvalNumber" TEXT,
ADD COLUMN     "approvalStatus" "CostApprovalStatus",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" UUID,
ADD COLUMN     "expenseAccount" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_approvalNumber_key" ON "work_orders"("approvalNumber");

-- CreateIndex
CREATE INDEX "work_orders_approvalStatus_approvedAt_idx" ON "work_orders"("approvalStatus", "approvedAt");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

