/*
  Warnings:

  - Added the required column `deviceId` to the `PlaybackDeployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playlistVersion` to the `PlaybackDeployment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `PlaybackDeployment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'FAILED', 'PUBLISHED', 'ACKNOWLEDGED');

-- AlterTable
ALTER TABLE "PlaybackDeployment" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "playlistVersion" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "DeploymentStatus" NOT NULL;

-- DropEnum
DROP TYPE "SyncStatus";

-- AddForeignKey
ALTER TABLE "PlaybackDeployment" ADD CONSTRAINT "PlaybackDeployment_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
