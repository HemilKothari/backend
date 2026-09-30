/*
  Warnings:

  - You are about to drop the column `manifest` on the `PlaybackDeployment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlaybackDeployment" DROP COLUMN "manifest";

-- CreateTable
CREATE TABLE "PlaylistManifest" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "manifestHash" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistManifest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistManifest_playlistId_key" ON "PlaylistManifest"("playlistId");

-- AddForeignKey
ALTER TABLE "PlaylistManifest" ADD CONSTRAINT "PlaylistManifest_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
