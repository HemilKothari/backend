/*
  Warnings:

  - You are about to drop the column `rickshawId` on the `Device` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deviceId]` on the table `Rickshaw` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_rickshawId_fkey";

-- DropIndex
DROP INDEX "Device_rickshawId_key";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "rickshawId";

-- AlterTable
ALTER TABLE "Rickshaw" ADD COLUMN     "deviceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Rickshaw_deviceId_key" ON "Rickshaw"("deviceId");

-- AddForeignKey
ALTER TABLE "Rickshaw" ADD CONSTRAINT "Rickshaw_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
