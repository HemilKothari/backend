/*
  Warnings:

  - Added the required column `updatedAt` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "simNumber" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
