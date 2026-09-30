/*
  Warnings:

  - You are about to drop the column `estimatedDailyPassengers` on the `Rickshaw` table. All the data in the column will be lost.
  - Added the required column `ownerName` to the `Rickshaw` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerPhone` to the `Rickshaw` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Rickshaw` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleType` to the `Rickshaw` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Rickshaw" DROP COLUMN "estimatedDailyPassengers",
ADD COLUMN     "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "ownerName" TEXT NOT NULL,
ADD COLUMN     "ownerPhone" TEXT NOT NULL,
ADD COLUMN     "permitExpiry" TIMESTAMP(3),
ADD COLUMN     "pucExpiry" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vehicleType" TEXT NOT NULL;
