import { Injectable } from '@nestjs/common';
import { SHIFT_BREAK_THRESHOLD_MINUTES } from 'src/common/constants/driver.constant';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivitySession } from './interfaces/activity-session.interface';

@Injectable()
export class DriverActivityGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSessions(
    telemetryLogs: { timestamp: Date }[],
  ): ActivitySession[] {
    if (!telemetryLogs.length) {
      return [];
    }

    const sessions: ActivitySession[] = [];

    let sessionStart = telemetryLogs[0].timestamp;
    let previous = telemetryLogs[0].timestamp;

    for (let i = 1; i < telemetryLogs.length; i++) {
      const current = telemetryLogs[i].timestamp;

      const gapMinutes = (current.getTime() - previous.getTime()) / (1000 * 60);

      if (gapMinutes > SHIFT_BREAK_THRESHOLD_MINUTES) {
        sessions.push({
          startTime: sessionStart,
          endTime: previous,
        });

        sessionStart = current;
      }

      previous = current;
    }

    sessions.push({
      startTime: sessionStart,
      endTime: previous,
    });

    return sessions;
  }

  async processTelemetryBatch(
    deviceId: string,
    telemetryLogs: {
      timestamp: Date;
    }[],
  ) {
    if (!telemetryLogs.length) {
      return;
    }

    const logs = [...telemetryLogs].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const sessions = this.buildSessions(logs);
    console.log(sessions);

    await this.persistSessions(deviceId, sessions);
  }

  private async persistSessions(deviceId: string, sessions: ActivitySession[]) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: deviceId,
      },

      select: {
        id: true,

        rickshaw: true,
      },
    });

    if (!device?.rickshaw) {
      return;
    }

    for (const session of sessions) {
      const existing = await this.prisma.driverActivity.findFirst({
        where: {
          rickshawId: device.rickshaw.id,

          startTime: session.startTime,
        },
      });

      if (existing) {
        if (
          existing.endTime &&
          existing.endTime.getTime() >= session.endTime.getTime()
        ) {
          continue;
        }

        const newRuntime =
          (session.endTime.getTime() - session.startTime.getTime()) /
          (1000 * 60 * 60);

        await this.prisma.driverActivity.update({
          where: {
            id: existing.id,
          },

          data: {
            endTime: session.endTime,

            runtimeHours: newRuntime,
          },
        });

        continue;
      }

      const runtimeHours =
        (session.endTime.getTime() - session.startTime.getTime()) /
        (1000 * 60 * 60);

      await this.prisma.driverActivity.create({
        data: {
          rickshawId: device.rickshaw.id,

          startTime: session.startTime,

          endTime: session.endTime,

          runtimeHours,
        },
      });
    }
  }
}
