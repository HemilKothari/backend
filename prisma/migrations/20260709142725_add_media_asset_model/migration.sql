/*
  Warnings:

  - You are about to drop the column `mediaId` on the `Campaign` table. All the data in the column will be lost.
  - Added the required column `mediaAssetId` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_mediaId_fkey";

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "mediaId",
ADD COLUMN     "mediaAssetId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
