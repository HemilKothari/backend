import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverActivityService } from '../driver-activity/driver-activity.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateDriverPayoutDto } from './dto/generate-driver-payout.dto';
import { SummaryPeriod } from '../driver-activity/enums/summary-period.enum';
import { DRIVER_PAYOUT } from 'src/common/constants/driver.constant';
import { GeneratePayoutResult } from './interfaces/generate-payout.interface';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class DriverPayoutService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly driverActivityService: DriverActivityService,
    private readonly auditService: AuditService,
  ) {}

  private calculatePayout(activeDays: number) {
    const monthlyIncentive = DRIVER_PAYOUT.MONTHLY_INCENTIVE;

    const expectedActiveDays = DRIVER_PAYOUT.EXPECTED_ACTIVE_DAYS;

    const missedDays = Math.max(expectedActiveDays - activeDays, 0);

    const deductionPerDay = monthlyIncentive / expectedActiveDays;

    const deductionAmount = missedDays * deductionPerDay;

    const payoutAmount = Math.max(monthlyIncentive - deductionAmount, 0);

    return {
      monthlyIncentive,
      expectedActiveDays,
      missedDays,
      deductionAmount,
      payoutAmount,
    };
  }

  async generateIfNotExists(
    dto: GenerateDriverPayoutDto,
  ): Promise<GeneratePayoutResult> {
    const existing = await this.prisma.driverPayout.findUnique({
      where: {
        rickshawId_month_year: {
          rickshawId: dto.rickshawId,
          month: dto.month,
          year: dto.year,
        },
      },
    });

    if (existing) {
      return {
        payout: existing,
        created: false,
      };
    }

    try {
      const payout = await this.generate(dto);

      return {
        payout,
        created: true,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const payout = await this.prisma.driverPayout.findUnique({
          where: {
            rickshawId_month_year: {
              rickshawId: dto.rickshawId,
              month: dto.month,
              year: dto.year,
            },
          },
        });

        if (payout) {
          return {
            payout,
            created: false,
          };
        }
      }

      throw error;
    }
  }

  async generate(dto: GenerateDriverPayoutDto) {
    const now = new Date();

    if (
      dto.year > now.getFullYear() ||
      (dto.year === now.getFullYear() && dto.month >= now.getMonth() + 1)
    ) {
      throw new BadRequestException(
        'Payout can only be generated after the month has ended.',
      );
    }

    const rickshaw = await this.prisma.rickshaw.findUnique({
      where: {
        id: dto.rickshawId,
      },
      include: {
        driver: true,
      },
    });

    if (!rickshaw) {
      throw new NotFoundException('Rickshaw not found.');
    }

    if (!rickshaw.driver) {
      throw new BadRequestException('Rickshaw is not assigned to a driver.');
    }

    const summary = await this.driverActivityService.getSummaryInternal(
      dto.rickshawId,
      {
        period: SummaryPeriod.MONTHLY,
        month: dto.month,
        year: dto.year,
      },
    );

    const payout = this.calculatePayout(summary.activeDays);

    const payoutRecord = await this.prisma.driverPayout.create({
      data: {
        driverId: rickshaw.driver.id,

        rickshawId: dto.rickshawId,

        month: dto.month,

        year: dto.year,

        runtimeHours: summary.runtimeHours,

        activeDays: summary.activeDays,

        expectedActiveDays: payout.expectedActiveDays,

        missedDays: payout.missedDays,

        monthlyIncentive: payout.monthlyIncentive,

        deductionAmount: payout.deductionAmount,

        payoutAmount: payout.payoutAmount,
      },
    });

    await this.auditService.log({
      action: AuditAction.PAYOUT_GENERATED,
      entityType: 'DriverPayout',
      entityId: payoutRecord.id,

      metadata: {
        driverId: payoutRecord.driverId,
        rickshawId: payoutRecord.rickshawId,
        month: payoutRecord.month,
        year: payoutRecord.year,
        payoutAmount: payoutRecord.payoutAmount,
        activeDays: payoutRecord.activeDays,
      },
    });

    return payoutRecord;
  }

  async findAll() {
    return this.prisma.driverPayout.findMany({
      include: {
        driver: true,
        rickshaw: {
          include: {
            driver: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const payout = await this.prisma.driverPayout.findUnique({
      where: {
        id,
      },
      include: {
        driver: true,
        rickshaw: {
          include: {
            driver: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found.');
    }

    return payout;
  }

  async getByRickshaw(rickshawId: string) {
    const rickshaw = await this.prisma.rickshaw.findUnique({
      where: {
        id: rickshawId,
      },
    });

    if (!rickshaw) {
      throw new NotFoundException('Rickshaw not found.');
    }

    return this.prisma.driverPayout.findMany({
      where: {
        rickshawId,
      },
      include: {
        driver: true,
      },
      orderBy: [
        {
          year: 'desc',
        },
        {
          month: 'desc',
        },
      ],
    });
  }

  async markPaid(id: string, user: AuthenticatedUser) {
    const payout = await this.prisma.driverPayout.findUnique({
      where: {
        id,
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found.');
    }

    if (payout.paid) {
      throw new BadRequestException('Payout has already been marked as paid.');
    }

    const updatedPayout = await this.prisma.driverPayout.update({
      where: {
        id,
      },
      data: {
        paid: true,
        paidAt: new Date(),
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.PAYOUT_MARKED_PAID,
      entityType: 'DriverPayout',
      entityId: updatedPayout.id,

      metadata: {
        driverId: updatedPayout.driverId,
        rickshawId: updatedPayout.rickshawId,
        month: updatedPayout.month,
        year: updatedPayout.year,
        payoutAmount: updatedPayout.payoutAmount,
      },
    });

    return updatedPayout;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const payout = await this.prisma.driverPayout.findUnique({
      where: {
        id,
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found.');
    }

    if (payout.paid) {
      throw new BadRequestException('Paid payouts cannot be deleted.');
    }

    await this.prisma.driverPayout.delete({
      where: {
        id,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.PAYOUT_DELETED,
      entityType: 'DriverPayout',
      entityId: payout.id,

      metadata: {
        driverId: payout.driverId,
        rickshawId: payout.rickshawId,
        month: payout.month,
        year: payout.year,
        payoutAmount: payout.payoutAmount,
      },
    });

    return {
      success: true,
    };
  }
}
