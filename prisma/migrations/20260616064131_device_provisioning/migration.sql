/*
  Warnings:

  - Added the required column `updatedAt` to the `DeviceProvision` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeviceProvision" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "cmsDeviceId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "installerName" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
