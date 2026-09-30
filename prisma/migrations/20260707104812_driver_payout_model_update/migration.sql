/*
  Warnings:

  - You are about to drop the column `baseAmount` on the `DriverPayout` table. All the data in the column will be lost.
  - You are about to drop the column `bonusAmount` on the `DriverPayout` table. All the data in the column will be lost.
  - You are about to drop the column `deductionAmount` on the `DriverPayout` table. All the data in the column will be lost.
  - Added the required column `payoutRate` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runtimeHours` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DriverPayout" DROP COLUMN "baseAmount",
DROP COLUMN "bonusAmount",
DROP COLUMN "deductionAmount",
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payoutRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "runtimeHours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
