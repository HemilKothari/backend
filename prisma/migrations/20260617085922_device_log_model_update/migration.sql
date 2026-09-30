/*
  Warnings:

  - You are about to drop the column `status` on the `DeviceLog` table. All the data in the column will be lost.
  - Added the required column `isOnline` to the `DeviceLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "lastHeartbeatAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DeviceLog" DROP COLUMN "status",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentlyPlaying" TEXT,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL,
ALTER COLUMN "timestamp" DROP DEFAULT;
