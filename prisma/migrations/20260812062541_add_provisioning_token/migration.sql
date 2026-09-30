/*
  Warnings:

  - A unique constraint covering the columns `[provisioningTokenHash]` on the table `DeviceProvision` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DeviceProvision" ADD COLUMN     "provisioningExpiresAt" TIMESTAMP(3),
ADD COLUMN     "provisioningTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceProvision_provisioningTokenHash_key" ON "DeviceProvision"("provisioningTokenHash");
