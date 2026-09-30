import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateTelemetryBatchDto } from './dto/create-telemetry-batch.dto';
import { CreateSyncDto } from './dto/create-sync.dto';
import { DriverActivityGeneratorService } from '../driver-activity/driver-activity-generator.service';
import { AuthenticatedDevice } from '../player-runtime/interfaces/authenticated-device.interface';

@Injectable()
export class TelemetryService {
  constructor(private prisma: PrismaService, private driverActivityGeneratorService: DriverActivityGeneratorService) {}

  async getLatest() {
    return this.prisma.deviceLog.findMany({
      take: 100,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        device: true,
      },
    });
  }

  async getByDevice(deviceId: string) {
    return this.prisma.deviceLog.findMany({
      where: {
        deviceId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async getOfflineDevices() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    return this.prisma.device.findMany({
      where: {
        OR: [
          {
            lastHeartbeatAt: null,
          },
          {
            lastHeartbeatAt: {
              lt: fifteenMinutesAgo,
            },
          },
        ],
      },
    });
  }

  async getLiveStatus() {
    return this.prisma.device.findMany({
      select: {
        id: true,
        deviceCode: true,
        status: true,
        lastHeartbeatAt: true,
        lastSeen: true,
      },
    });
  }

  async sync(
  device: AuthenticatedDevice,
  dto: CreateSyncDto,
) {
  if (!device) {
    throw new NotFoundException('Device not found.');
  }

  const telemetryLogs = dto.telemetryLogs ?? [];
  const playbackEvents = dto.playbackEvents ?? [];

  if (telemetryLogs.length) {
    await this.prisma.deviceLog.createMany({
      data: telemetryLogs.map((log) => ({
        deviceId: device.id,

        latitude: log.latitude,
        longitude: log.longitude,

        playlistVersion: log.playlistVersion,

        currentlyPlaying: log.currentlyPlaying,

        batteryLevel: log.batteryLevel,

        networkStrength: log.networkStrength,

        isOnline: log.isOnline,

        timestamp: new Date(log.timestamp),
      })),
    });
  }

  if (playbackEvents.length) {
    await this.prisma.playbackEvent.createMany({
      data: playbackEvents.map((event) => ({
        deviceId: device.id,

        campaignId: event.campaignId,

        playlistId: event.playlistId ?? null,

        playlistItemId: event.playlistItemId ?? null,

        playedAt: new Date(event.playedAt),

        latitude: event.latitude,

        longitude: event.longitude,
      })),
    });
  }

  const now = new Date();

  await this.prisma.device.update({
    where: {
      id: device.id,
    },

    data: {
      lastSeen: now,
    },
  });

  await this.driverActivityGeneratorService.processTelemetryBatch(
    device.id,

    telemetryLogs.map((log) => ({
      timestamp: new Date(log.timestamp),
    })),
  );

  return {
    success: true,

    telemetryReceived: telemetryLogs.length,

    playbackReceived: playbackEvents.length,

    serverTime: now,
  };
}
}
