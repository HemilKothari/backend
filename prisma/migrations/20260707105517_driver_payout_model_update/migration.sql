/*
  Warnings:

  - You are about to drop the column `payoutRate` on the `DriverPayout` table. All the data in the column will be lost.
  - Added the required column `expectedActiveDays` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `missedDays` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyIncentive` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DriverPayout" DROP COLUMN "payoutRate",
ADD COLUMN     "expectedActiveDays" INTEGER NOT NULL,
ADD COLUMN     "missedDays" INTEGER NOT NULL,
ADD COLUMN     "monthlyIncentive" DOUBLE PRECISION NOT NULL;
