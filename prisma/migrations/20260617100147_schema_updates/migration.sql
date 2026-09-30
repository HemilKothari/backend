/*
  Warnings:

  - You are about to alter the column `impressions` on the `CampaignReport` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to drop the column `active` on the `Playlist` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[version]` on the table `Playlist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlaylistStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "totalSlotsPerLoop" INTEGER;

-- AlterTable
ALTER TABLE "CampaignAssignment" ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "CampaignReport" ALTER COLUMN "impressions" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "currentPlaylistId" TEXT;

-- AlterTable
ALTER TABLE "DeviceLog" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "playlistId" TEXT;

-- AlterTable
ALTER TABLE "Playlist" DROP COLUMN "active",
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "playlistGroup" TEXT,
ADD COLUMN     "status" "PlaylistStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "totalSlots" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "PlaylistItem" ADD COLUMN     "campaignId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_version_key" ON "Playlist"("version");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_currentPlaylistId_fkey" FOREIGN KEY ("currentPlaylistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistItem" ADD CONSTRAINT "PlaylistItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLog" ADD CONSTRAINT "DeviceLog_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLog" ADD CONSTRAINT "DeviceLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
