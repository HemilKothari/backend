import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignsService } from 'src/modules/campaigns/campaigns.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CampaignExpiryScheduler {
  private readonly logger = new Logger(CampaignExpiryScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignsService: CampaignsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async completeExpiredCampaign() {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',

        endDate: {
          not: null,
          lte: new Date(),
        },
      },

      select: {
        id: true,
        campaignName: true,
      },
    });

    this.logger.log(`Found ${campaigns.length} expired campaigns`);

    let success = 0;

    let failed = 0;

    for (const campaign of campaigns) {
      try {
        await this.campaignsService.complete(campaign.id);

        success++;
      } catch (error) {
        failed++;

        this.logger.error(
          `Failed completing campaign ${campaign.campaignName}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log(
      `Campaign expiry completed.
Success:${success}
Failed:${failed}`,
    );
  }
}
