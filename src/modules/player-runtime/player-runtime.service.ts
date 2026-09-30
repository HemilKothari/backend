import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthenticatedDevice } from './interfaces/authenticated-device.interface';
import { PLAYER_RUNTIME } from './constants/player-runtime.constant';
import { SyncRequestDto } from './dto/sync-request.dto';
import { SyncResponseDto } from './dto/sync-response.dto';
import { randomBytes } from 'crypto';
import { ProvisionPlayerDto } from './dto/provision-player.dto';
import { hashProvisioningToken } from 'src/common/utils/provisioning-token.util';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { ManifestAckDto } from './dto/manifest-ack.dto';
import { CreateSyncDto } from '../telemetry/dto/create-sync.dto';
import { DriverActivityGeneratorService } from '../driver-activity/driver-activity-generator.service';
import { AuditAction } from '../audit/audit.types';
import { STORAGE_PROVIDER } from 'src/modules/storage/constants';
import type { StorageProvider } from 'src/modules/storage/storage.interface';

@Injectable()
export class PlayerRuntimeService {
  constructor(
  private readonly prisma: PrismaService,

  private readonly driverActivityGeneratorService: DriverActivityGeneratorService,

  @Inject(STORAGE_PROVIDER)
  private readonly storage: StorageProvider,
) {}

  async checkSync(
    device: AuthenticatedDevice,
    dto: SyncRequestDto,
  ): Promise<SyncResponseDto> {
    const deployment = await this.prisma.playbackDeployment.findFirst({
      where: {
        deviceId: device.id,
        status: 'PUBLISHED',
      },

      orderBy: {
        publishedAt: 'desc',
      },

      include: {
        playlistManifest: true,
      },
    });

    if (!deployment) {
      return {
        syncRequired: false,

        manifestVersion: null,

        lastPublishedAt: null,

        syncIntervalSeconds: PLAYER_RUNTIME.SYNC_INTERVAL_SECONDS,

        heartbeatIntervalSeconds: PLAYER_RUNTIME.HEARTBEAT_INTERVAL_SECONDS,

        telemetryIntervalSeconds: PLAYER_RUNTIME.TELEMETRY_INTERVAL_SECONDS,

        downloadRetryIntervalSeconds:
          PLAYER_RUNTIME.DOWNLOAD_RETRY_INTERVAL_SECONDS,

        serverTime: new Date(),

        reason: 'NO_PLAYLIST',
      };
    }

    const syncRequired =
      deployment.playlistManifest.version !== dto.currentManifestVersion;

    return {
      syncRequired,

      manifestVersion: deployment.playlistManifest.version,

      lastPublishedAt: deployment.publishedAt,

      syncIntervalSeconds: PLAYER_RUNTIME.SYNC_INTERVAL_SECONDS,

      heartbeatIntervalSeconds: PLAYER_RUNTIME.HEARTBEAT_INTERVAL_SECONDS,

      telemetryIntervalSeconds: PLAYER_RUNTIME.TELEMETRY_INTERVAL_SECONDS,

      downloadRetryIntervalSeconds:
        PLAYER_RUNTIME.DOWNLOAD_RETRY_INTERVAL_SECONDS,

      serverTime: new Date(),
    };
  }

  async uploadSync(device: AuthenticatedDevice, dto: CreateSyncDto) {
    if (!device) {
      throw new NotFoundException('Device not found.');
    }

    const telemetryLogs = dto.telemetryLogs ?? [];
    const playbackEvents = dto.playbackEvents ?? [];

    // Store telemetry logs
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

    // Store playback events
    if (playbackEvents.length) {
      await this.prisma.playbackEvent.createMany({
        data: playbackEvents.map((event) => ({
          deviceId: device.id,

          campaignId: event.campaignId,

          playlistId: event.playlistId ?? null,

          playlistItemId: event.playlistItemId ?? null,

          playedAt: new Date(event.playedAt),

          latitude: event.latitude ?? null,

          longitude: event.longitude ?? null,
        })),
      });
    }

    const now = new Date();

    // Any successful sync proves that the device communicated
    await this.prisma.device.update({
      where: {
        id: device.id,
      },

      data: {
        lastSeen: now,
      },
    });

    // Process telemetry for driver activity/session generation
    if (telemetryLogs.length) {
      await this.driverActivityGeneratorService.processTelemetryBatch(
        device.id,
        telemetryLogs.map((log) => ({
          timestamp: new Date(log.timestamp),
        })),
      );
    }

    return {
      success: true,

      telemetryReceived: telemetryLogs.length,

      playbackReceived: playbackEvents.length,

      serverTime: now,
    };
  }

  async getManifest(device: AuthenticatedDevice) {
    const deployment = await this.prisma.playbackDeployment.findFirst({
      where: {
        deviceId: device.id,
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        playlistManifest: true,
      },
    });

    if (!deployment) {
      throw new NotFoundException('No published manifest available.');
    }

    await this.prisma.device.update({
      where: {
        id: device.id,
      },

      data: {
        lastManifestVersion: deployment.playlistManifest.version,

        lastManifestSyncAt: new Date(),
      },
    });

    return deployment.playlistManifest.manifest;
  }

  async downloadMedia(
  device: AuthenticatedDevice,
  mediaId: string,
) {
  const media = await this.prisma.mediaAsset.findUnique({
    where: {
      id: mediaId,
    },
  });

  if (!media) {
    throw new NotFoundException('Media not found.');
  }

  const allowed =
    await this.prisma.playlistItem.findFirst({
      where: {
        mediaId,

        playlist: {
          deviceId: device.id,
        },
      },

      select: {
        id: true,
      },
    });

  if (!allowed) {
    throw new ForbiddenException(
      'Media does not belong to this device.',
    );
  }

  const downloadUrl =
    await this.storage.createPresignedDownloadUrl(
      media.storageKey,
      600,
    );

  return {
    mediaId: media.id,
    fileName: media.originalFileName,
    mimeType: media.mimeType,
    fileSize: media.fileSize,
    checksum: media.checksum,
    downloadUrl,
    expiresIn: 600,
  };
}

  async provision(dto: ProvisionPlayerDto) {
    const tokenHash = hashProvisioningToken(dto.provisioningToken);

    return this.prisma.$transaction(async (tx) => {
      const provision = await tx.deviceProvision.findUnique({
        where: {
          provisioningTokenHash: tokenHash,
        },
      });

      if (!provision) {
        throw new NotFoundException('Invalid provisioning token.');
      }

      const now = new Date();

      if (provision.activatedAt) {
        throw new ConflictException(
          'This provisioning token has already been used.',
        );
      }

      if (
        provision.provisioningExpiresAt &&
        provision.provisioningExpiresAt <= now
      ) {
        throw new ForbiddenException('Provisioning token has expired.');
      }

      const sequenceResult = await tx.$queryRaw<
        { nextval: bigint }[]
      >`SELECT nextval('device_code_seq')`;

      const deviceCode = `AOTG-${sequenceResult[0].nextval
        .toString()
        .padStart(6, '0')}`;

      const apiKey = randomBytes(32).toString('hex');

      /*
       * Atomically consume the provisioning token.
       *
       * Only one concurrent request can successfully
       * update this row.
       */
      const consumed = await tx.deviceProvision.updateMany({
        where: {
          id: provision.id,

          provisioningTokenHash: tokenHash,

          activatedAt: null,

          provisioningExpiresAt: {
            gt: now,
          },
        },

        data: {
          activatedAt: now,

          provisioningTokenHash: null,

          provisioningExpiresAt: null,
        },
      });

      if (consumed.count !== 1) {
        throw new ConflictException(
          'Provisioning token has already been used or is no longer valid.',
        );
      }

      const device = await tx.device.update({
        where: {
          id: provision.deviceId,
        },

        data: {
          deviceCode,

          apiKey,

          status: 'ONLINE',

          lastSeen: now,
        },
      });

      await tx.auditLog.create({
        data: {
          action: AuditAction.DEVICE_PROVISIONED,
          entityType: 'Device',
          entityId: device.id,
          success: true,
          metadata: {
            deviceCode: device.deviceCode,
          },
        },
      });

      return {
        success: true,

        device: {
          id: device.id,

          deviceCode: device.deviceCode,
        },

        authentication: {
          apiKey,
        },

        runtime: {
          syncIntervalSeconds: 300,

          heartbeatIntervalSeconds: 60,

          telemetryIntervalSeconds: 300,

          downloadRetryIntervalSeconds: 30,
        },

        serverTime: now,
      };
    });
  }

  async heartbeat(device: AuthenticatedDevice, dto: HeartbeatDto) {
    const deviceRecord = await this.prisma.device.findUnique({
      where: {
        id: device.id,
      },

      select: {
        status: true,
      },
    });

    if (!deviceRecord) {
      throw new NotFoundException('Device not found.');
    }

    if (deviceRecord.status === 'DECOMMISSIONED') {
      throw new ForbiddenException('Device has been decommissioned.');
    }

    const now = new Date();

    await this.prisma.device.update({
      where: {
        id: device.id,
      },

      data: {
        lastSeen: now,

        lastHeartbeatAt: now,

        ...(deviceRecord.status !== 'MAINTENANCE'
          ? {
              status: 'ONLINE',
            }
          : {}),
      },
    });

    return {
      success: true,

      serverTime: now,

      nextHeartbeatIn: 60,
    };
  }

  async acknowledgeManifest(device: AuthenticatedDevice, dto: ManifestAckDto) {
    const deployment = await this.prisma.playbackDeployment.findFirst({
      where: {
        deviceId: device.id,

        playlistManifest: {
          version: dto.manifestVersion,
        },
      },

      orderBy: {
        publishedAt: 'desc',
      },
    });

    if (!deployment) {
      throw new NotFoundException(
        'Manifest deployment not found for this device.',
      );
    }

    // Already acknowledged — return success.
    if (deployment.acknowledgedAt) {
      return {
        success: true,
        manifestVersion: dto.manifestVersion,
        acknowledgedAt: deployment.acknowledgedAt,
        alreadyAcknowledged: true,
      };
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.playbackDeployment.update({
        where: {
          id: deployment.id,
        },

        data: {
          acknowledgedAt: now,
        },
      });

      await tx.device.update({
        where: {
          id: device.id,
        },

        data: {
          lastManifestVersion: dto.manifestVersion,
          lastManifestSyncAt: now,
        },
      });
    });

    return {
      success: true,
      manifestVersion: dto.manifestVersion,
      acknowledgedAt: now,
      alreadyAcknowledged: false,
    };
  }
}
