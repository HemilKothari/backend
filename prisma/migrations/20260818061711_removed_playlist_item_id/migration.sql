/*
  Warnings:

  - You are about to drop the column `playlistItemId` on the `PlaylistManifest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlaylistManifest" DROP CONSTRAINT "PlaylistManifest_playlistItemId_fkey";

-- DropIndex
DROP INDEX "PlaylistManifest_playlistItemId_key";

-- AlterTable
ALTER TABLE "PlaylistManifest" DROP COLUMN "playlistItemId";
