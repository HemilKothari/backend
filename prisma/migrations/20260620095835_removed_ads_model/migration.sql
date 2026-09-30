/*
  Warnings:

  - The values [PAUSED] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `adId` on the `PlaylistItem` table. All the data in the column will be lost.
  - You are about to drop the `Ad` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."CampaignAssignment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CampaignAssignment" ALTER COLUMN "status" TYPE "AssignmentStatus_new" USING ("status"::text::"AssignmentStatus_new");
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "public"."AssignmentStatus_old";
ALTER TABLE "CampaignAssignment" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Ad" DROP CONSTRAINT "Ad_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistItem" DROP CONSTRAINT "PlaylistItem_adId_fkey";

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "creativeChangesAllowed" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "creativeChangesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "PlaylistItem" DROP COLUMN "adId";

-- DropTable
DROP TABLE "Ad";
