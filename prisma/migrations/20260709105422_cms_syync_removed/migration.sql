/*
  Warnings:

  - You are about to drop the column `syncedAt` on the `PlaybackDeployment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlaybackDeployment" DROP COLUMN "syncedAt",
ADD COLUMN     "publishedAt" TIMESTAMP(3);
