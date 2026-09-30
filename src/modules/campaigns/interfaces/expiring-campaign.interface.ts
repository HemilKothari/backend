export interface ExpiringCampaign {
  id: string;

  campaignName: string;

  endDate: Date | null;

  daysRemaining: number;
}