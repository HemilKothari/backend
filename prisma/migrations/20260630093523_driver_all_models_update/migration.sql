/*
  Warnings:

  - A unique constraint covering the columns `[driverId,documentType]` on the table `DriverDocument` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `baseAmount` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "inactiveReason" TEXT,
ADD COLUMN     "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DriverActivity" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DriverDocument" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
ALTER TABLE "DriverPayout" ADD COLUMN     "baseAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "bonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deductionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "DriverDocument_driverId_documentType_key" ON "DriverDocument"("driverId", "documentType");
