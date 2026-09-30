/*
  Warnings:

  - You are about to drop the column `impressions` on the `CampaignReport` table. All the data in the column will be lost.
  - Added the required column `averagePlaybacksPerDevice` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedImpressions` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodEnd` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playbacks` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportType` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uniqueDevices` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'FINAL');

-- AlterTable
ALTER TABLE "CampaignReport" DROP COLUMN "impressions",
ADD COLUMN     "averagePlaybacksPerDevice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "estimatedImpressions" INTEGER NOT NULL,
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "playbacks" INTEGER NOT NULL,
ADD COLUMN     "reportType" "ReportType" NOT NULL,
ADD COLUMN     "uniqueDevices" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "CampaignReport_campaignId_reportType_idx" ON "CampaignReport"("campaignId", "reportType");
