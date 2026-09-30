import { Module } from '@nestjs/common';

import { ReportsModule } from '../modules/reports/reports.module';
import { DriverPayoutModule } from '../modules/driver-payout/driver-payout.module';

import { ReportsScheduler } from './reports.scheduler';
import { DriverPayoutScheduler } from './driver-payout.scheduler';
import { CampaignsModule } from 'src/modules/campaigns/campaigns.module';
import { CampaignExpiryScheduler } from './campaign-expiry.scheduler';

@Module({
  imports: [
    ReportsModule,
    DriverPayoutModule,
    CampaignsModule
  ],

  providers: [
    ReportsScheduler,
    DriverPayoutScheduler,
    CampaignExpiryScheduler,
  ],
})
export class SchedulerModule {}