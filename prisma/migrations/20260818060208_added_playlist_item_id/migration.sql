/*
  Warnings:

  - A unique constraint covering the columns `[playlistItemId]` on the table `PlaylistManifest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `playlistItemId` to the `PlaylistManifest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlaylistManifest" ADD COLUMN     "playlistItemId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistManifest_playlistItemId_key" ON "PlaylistManifest"("playlistItemId");

-- AddForeignKey
ALTER TABLE "PlaylistManifest" ADD CONSTRAINT "PlaylistManifest_playlistItemId_fkey" FOREIGN KEY ("playlistItemId") REFERENCES "PlaylistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
