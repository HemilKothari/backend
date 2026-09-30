/*
  Warnings:

  - A unique constraint covering the columns `[deviceId,playlistVersion]` on the table `PlaybackDeployment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `manifest` to the `PlaybackDeployment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlaybackDeployment" ADD COLUMN     "manifest" JSONB NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackDeployment_deviceId_playlistVersion_key" ON "PlaybackDeployment"("deviceId", "playlistVersion");
