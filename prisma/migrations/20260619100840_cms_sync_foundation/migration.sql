/*
  Warnings:

  - Added the required column `providerType` to the `CmsProvider` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "CmsProvider" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "providerType" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PlaylistSync" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "cmsProviderId" TEXT,
    "status" "SyncStatus" NOT NULL,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistSync_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlaylistSync" ADD CONSTRAINT "PlaylistSync_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
