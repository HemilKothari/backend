import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from 'src/modules/reports/reports.service';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ReportsScheduler {
  private readonly logger = new Logger(ReportsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private reportsService: ReportsService,
  ) {}

  private async runForActiveCampaigns<T>(
    generator: (campaignId: string) => Promise<T>,
    reportName: string,
  ) {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    this.logger.log(
      `Generating ${reportName} reports for ${campaigns.length} campaigns`,
    );

    for (const campaign of campaigns) {
      try {
        await generator(campaign.id);
      } catch (error) {
        this.logger.error(
          `${reportName} report failed for campaign ${campaign.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log(`${reportName} reports completed`);
  }

  @Cron('0 0 0 * * 0')
  async generateWeeklyReports() {
    await this.runForActiveCampaigns(
      (id) => this.reportsService.generateWeeklyReportInternal(id),
      'Weekly',
    );
  }

  @Cron('0 0 0 1 * *')
  async generateMonthlyReports() {
    await this.runForActiveCampaigns(
      (id) => this.reportsService.generateMonthlyReportInternal(id),
      'Monthly',
    );
  }

  @Cron('0 0 0 1 1,4,7,10 *')
  async generateQuarterlyReports() {
    await this.runForActiveCampaigns(
      (id) => this.reportsService.generateQuarterlyReportInternal(id),
      'Quarterly',
    );
  }
}
