import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDriverActivityDto } from './dto/create-driver-activity.dto';
import { UpdateDriverActivityDto } from './dto/update-driver-activity.dto';
import { DailyBreakdown } from './interfaces/daily-breakdown.interface';
import { DRIVER_ACTIVE_DAY_THRESHOLD } from 'src/common/constants/driver.constant';
import { DriverActivity, UserRole } from '@prisma/client';
import { GetSummaryDto } from './dto/get-summary.dto';
import { SummaryPeriod } from './enums/summary-period.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class DriverActivityService {
  constructor(private prisma: PrismaService) {}

  private async getRickshawForUser(
    rickshawId: string,
    user: AuthenticatedUser,
  ) {
    const rickshaw = await this.prisma.rickshaw.findUnique({
      where: {
        id: rickshawId,
      },
    });

    if (!rickshaw) {
      throw new NotFoundException('Rickshaw not found.');
    }

    if (user.role === UserRole.DRIVER) {
      if (!user.driverId || rickshaw.driverId !== user.driverId) {
        throw new NotFoundException('Rickshaw not found.');
      }
    }

    return rickshaw;
  }

  async findAll() {
    return this.prisma.driverActivity.findMany({
      include: {
        rickshaw: {
          include: {
            driver: true,
          },
        },
      },

      orderBy: {
        endTime: 'desc',
      },
    });
  }

  async findOne(
  id: string,
  user: AuthenticatedUser,
) {
  const activity =
    await this.prisma.driverActivity.findUnique({
      where: {
        id,
      },
      include: {
        rickshaw: {
          include: {
            driver: true,
          },
        },
      },
    });

  if (!activity) {
    throw new NotFoundException(
      'Activity not found.',
    );
  }

  if (user.role === UserRole.DRIVER) {
    if (
      !user.driverId ||
      activity.rickshaw.driverId !== user.driverId
    ) {
      throw new NotFoundException(
        'Activity not found.',
      );
    }
  }

  return activity;
}

  async findByRickshaw(
  rickshawId: string,
  user: AuthenticatedUser,
) {
  await this.getRickshawForUser(
    rickshawId,
    user,
  );

  return this.prisma.driverActivity.findMany({
    where: {
      rickshawId,
    },
    orderBy: {
      startTime: 'desc',
    },
  });
}

  private async generateSummary(rickshawId: string, start: Date, end: Date) {
    const activities = await this.prisma.driverActivity.findMany({
      where: {
        rickshawId,

        startTime: {
          gte: start,
          lt: end,
        },
      },

      orderBy: {
        startTime: 'asc',
      },
    });

    const grouped = this.groupActivitiesByDay(activities);

    const summary = this.calculateSummary(grouped);

    return {
      startDate: start,

      endDate: end,

      runtimeHours: summary.runtimeHours,

      activeDays: summary.activeDays,

      totalSessions: summary.totalSessions,

      totalRecords: activities.length,

      dailyBreakdown: summary.dailyBreakdown,
    };
  }

  private resolveDateRange(dto: GetSummaryDto): {
    start: Date;
    end: Date;
  } {
    switch (dto.period) {
      case SummaryPeriod.DAILY: {
        if (!dto.date) {
          throw new BadRequestException('date is required for DAILY summary');
        }

        const start = new Date(dto.date);

        start.setHours(0, 0, 0, 0);

        const end = new Date(start);

        end.setDate(end.getDate() + 1);

        return {
          start,
          end,
        };
      }

      case SummaryPeriod.WEEKLY: {
        if (!dto.startDate) {
          throw new BadRequestException(
            'startDate is required for WEEKLY summary',
          );
        }

        const start = new Date(dto.startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        return { start, end };
      }

      case SummaryPeriod.MONTHLY: {
        if (!dto.month || !dto.year) {
          throw new BadRequestException(
            'month and year are required for MONTHLY summary',
          );
        }

        const start = new Date(dto.year, dto.month - 1, 1);

        const end = new Date(dto.year, dto.month, 1);

        return { start, end };
      }

      case SummaryPeriod.QUARTERLY: {
        if (!dto.quarter || !dto.year) {
          throw new BadRequestException('quarter and year are required');
        }

        const startMonth = (dto.quarter - 1) * 3;

        const start = new Date(dto.year, startMonth, 1);

        const end = new Date(dto.year, startMonth + 3, 1);

        return { start, end };
      }

      case SummaryPeriod.YEARLY: {
        if (!dto.year) {
          throw new BadRequestException('year is required');
        }

        const start = new Date(dto.year, 0, 1);

        const end = new Date(dto.year + 1, 0, 1);

        return { start, end };
      }

      case SummaryPeriod.CUSTOM: {
  if (!dto.startDate || !dto.endDate) {
    throw new BadRequestException(
      'startDate and endDate are required',
    );
  }

  const start = new Date(dto.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dto.endDate);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);

  if (end <= start) {
    throw new BadRequestException(
      'endDate must be on or after startDate.',
    );
  }

  return { start, end };
}

      default:
        throw new BadRequestException('Unsupported summary period');
    }
  }

  async getSummary(
  rickshawId: string,
  dto: GetSummaryDto,
  user: AuthenticatedUser,
) {
  await this.getRickshawForUser(
    rickshawId,
    user,
  );

  return this.getSummaryInternal(
    rickshawId,
    dto,
  );
}

async getSummaryInternal(
  rickshawId: string,
  dto: GetSummaryDto,
) {
  const { start, end } =
    this.resolveDateRange(dto);

  return this.generateSummary(
    rickshawId,
    start,
    end,
  );
}

  async update(
  id: string,
  dto: UpdateDriverActivityDto,
) {
  const activity =
    await this.prisma.driverActivity.findUnique({
      where: {
        id,
      },
    });

  if (!activity) {
    throw new NotFoundException(
      'Activity not found.',
    );
  }

  const startTime = dto.startTime
    ? new Date(dto.startTime)
    : activity.startTime;

  const endTime = dto.endTime
    ? new Date(dto.endTime)
    : activity.endTime;

  if (!endTime) {
    throw new BadRequestException(
      'endTime is required for an activity record.',
    );
  }

  if (endTime <= startTime) {
    throw new BadRequestException(
      'endTime must be after startTime.',
    );
  }

  const runtimeHours =
    (endTime.getTime() -
      startTime.getTime()) /
    (1000 * 60 * 60);

  return this.prisma.driverActivity.update({
    where: {
      id,
    },
    data: {
      startTime,
      endTime,
      runtimeHours,
    },
  });
}

  async remove(id: string) {
    const activity = await this.prisma.driverActivity.findUnique({
      where: {
        id,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    await this.prisma.driverActivity.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  }

  private groupActivitiesByDay(
    activities: DriverActivity[],
  ): Map<string, DriverActivity[]> {
    const grouped = new Map<string, DriverActivity[]>();

    for (const activity of activities) {
      const day = activity.startTime.toISOString().split('T')[0];

      if (!grouped.has(day)) {
        grouped.set(day, []);
      }

      grouped.get(day)!.push(activity);
    }

    return grouped;
  }

  private calculateSummary(groupedActivities: Map<string, DriverActivity[]>) {
    let runtimeHours = 0;

    let activeDays = 0;

    let totalSessions = 0;

    const dailyBreakdown: DailyBreakdown[] = [];

    for (const [date, sessions] of groupedActivities.entries()) {
      const dailyRuntime = sessions.reduce(
        (sum, session) => sum + session.runtimeHours,
        0,
      );

      const isActive = dailyRuntime >= DRIVER_ACTIVE_DAY_THRESHOLD;

      runtimeHours += dailyRuntime;

      totalSessions += sessions.length;

      if (isActive) {
        activeDays++;
      }

      dailyBreakdown.push({
        date,

        runtimeHours: dailyRuntime,

        sessionCount: sessions.length,

        activeDay: isActive,
      });
    }

    return {
      runtimeHours,

      activeDays,

      totalSessions,

      dailyBreakdown,
    };
  }
}
