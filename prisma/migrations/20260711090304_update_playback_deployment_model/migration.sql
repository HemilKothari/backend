/*
  Warnings:

  - You are about to drop the column `playlistVersion` on the `PlaybackDeployment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deviceId,playlistManifestId]` on the table `PlaybackDeployment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `playlistManifestId` to the `PlaybackDeployment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PlaybackDeployment_deviceId_playlistVersion_key";

-- AlterTable
ALTER TABLE "PlaybackDeployment" DROP COLUMN "playlistVersion",
ADD COLUMN     "playlistManifestId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackDeployment_deviceId_playlistManifestId_key" ON "PlaybackDeployment"("deviceId", "playlistManifestId");

-- AddForeignKey
ALTER TABLE "PlaybackDeployment" ADD CONSTRAINT "PlaybackDeployment_playlistManifestId_fkey" FOREIGN KEY ("playlistManifestId") REFERENCES "PlaylistManifest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
