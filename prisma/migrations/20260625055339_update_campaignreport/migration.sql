-- CreateIndex
CREATE INDEX "CampaignReport_reportType_idx" ON "CampaignReport"("reportType");

-- CreateIndex
CREATE INDEX "CampaignReport_periodStart_periodEnd_idx" ON "CampaignReport"("periodStart", "periodEnd");
