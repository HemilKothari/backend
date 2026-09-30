import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { DriverPayoutService } from 'src/modules/driver-payout/driver-payout.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DriverPayoutScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly driverPayoutService: DriverPayoutService,
  ) {}

  private readonly logger = new Logger(DriverPayoutScheduler.name);

  @Cron('5 0 1 * *')
  async generateMonthlyPayouts() {
    const today = new Date();

    let month = today.getMonth();

    let year = today.getFullYear();

    if (month === 0) {
      month = 12;
      year--;
    }

    this.logger.log(`Generating payouts for ${month}/${year}`);

    const rickshaws = await this.prisma.rickshaw.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
      },
    });

    let success = 0;

    let skipped = 0;

    let failed = 0;

    for (const rickshaw of rickshaws) {
      try {
        const result = await this.driverPayoutService.generateIfNotExists({
          rickshawId: rickshaw.id,
          month,
          year,
        });

        if (result.created) {
          success++;
        } else {
          skipped++;
        }
      } catch (error) {
        failed++;

        this.logger.error(
          `Failed generating payout for rickshaw ${rickshaw.id} of (${month}/${year})`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log(
      `Driver payout generation completed.
Success: ${success},
Skipped: ${skipped},
Failed: ${failed}`,
    );
  }
}
