/*
  Warnings:

  - You are about to drop the column `cmsDeviceId` on the `DeviceProvision` table. All the data in the column will be lost.
  - You are about to drop the column `cmsPlaylistId` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the column `cmsProviderId` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the `CmsProvider` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlaylistSync` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Playlist" DROP CONSTRAINT "Playlist_cmsProviderId_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistSync" DROP CONSTRAINT "PlaylistSync_playlistId_fkey";

-- AlterTable
ALTER TABLE "DeviceProvision" DROP COLUMN "cmsDeviceId";

-- AlterTable
ALTER TABLE "Playlist" DROP COLUMN "cmsPlaylistId",
DROP COLUMN "cmsProviderId";

-- DropTable
DROP TABLE "CmsProvider";

-- DropTable
DROP TABLE "PlaylistSync";

-- CreateTable
CREATE TABLE "PlaybackDeployment" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaybackDeployment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlaybackDeployment" ADD CONSTRAINT "PlaybackDeployment_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
