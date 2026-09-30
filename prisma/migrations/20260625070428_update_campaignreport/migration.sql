/*
  Warnings:

  - A unique constraint covering the columns `[campaignId,reportType,periodStart,periodEnd]` on the table `CampaignReport` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CampaignReport_campaignId_reportType_periodStart_periodEnd_key" ON "CampaignReport"("campaignId", "reportType", "periodStart", "periodEnd");
