/*
  Warnings:

  - Added the required column `driverId` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DriverPayout" ADD COLUMN     "driverId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "DriverPayout" ADD CONSTRAINT "DriverPayout_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
