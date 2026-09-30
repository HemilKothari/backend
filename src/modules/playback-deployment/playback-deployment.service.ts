import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlaybackManifestDto } from './dto/playback-manifest.dto';
import { DeploymentAckDto } from './dto/deployment-ack.dto';
import { Prisma, PlaybackDeployment } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PlaybackDeploymentService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(PlaybackDeploymentService.name);

  private calculateManifestHash(manifest: Prisma.InputJsonValue): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(manifest))
      .digest('hex');
  }

  async deployPlaylist(playlistId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: {
        id: playlistId,
      },

      include: {
        items: true,
      },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    let deployment: PlaybackDeployment;

    const manifest = JSON.parse(
      JSON.stringify(await this.buildManifest(playlist.id)),
    ) as Prisma.InputJsonValue;

    const manifestHash = this.calculateManifestHash(manifest);

    const playlistManifest = await this.prisma.playlistManifest.upsert({
      where: {
        playlistId: playlist.id,
      },

      update: {
        version: playlist.version,
        manifest,
        manifestHash,
      },

      create: {
        playlistId: playlist.id,
        version: playlist.version,
        manifest,
        manifestHash,
      },
    });

    const existingDeployment = await this.prisma.playbackDeployment.findFirst({
      where: {
        deviceId: playlist.deviceId,
        playlistManifestId: playlistManifest.id,
        status: 'PUBLISHED',
      },
    });

    if (existingDeployment) {
      return {
        success: true,
        skipped: true,
        reason: 'MANIFEST_ALREADY_DEPLOYED',

        deploymentId: existingDeployment.id,

        playlistId: playlist.id,

        manifestId: playlistManifest.id,

        version: playlistManifest.version,

        publishedAt: existingDeployment.publishedAt,
      };
    }

    try {
      deployment = await this.prisma.playbackDeployment.upsert({
        where: {
          deviceId_playlistManifestId: {
            deviceId: playlist.deviceId,
            playlistManifestId: playlistManifest.id,
          },
        },

        update: {
          status: 'PUBLISHED',

          publishedAt: new Date(),

          errorMessage: null,
        },

        create: {
          playlistId: playlist.id,

          deviceId: playlist.deviceId,

          playlistManifestId: playlistManifest.id,

          status: 'PUBLISHED',

          publishedAt: new Date(),
        },
      });
    } catch (error: any) {
      await this.prisma.playbackDeployment.create({
        data: {
          playlistId: playlist.id,

          deviceId: playlist.deviceId,

          playlistManifestId: playlistManifest.id,

          status: 'FAILED',

          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }

    return {
      success: true,

      deploymentId: deployment.id,

      playlistId: playlist.id,

      manifestId: playlistManifest.id,

      version: playlistManifest.version,

      publishedAt: deployment.publishedAt,
    };
  }

  async getPlaylists() {
    return this.prisma.playbackDeployment.findMany({
      include: {
        playlist: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDeployedPlaylist(playlistId: string) {
    return this.prisma.playbackDeployment.findMany({
      where: {
        playlistId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async buildManifest(
    playlistId: string,
  ): Promise<PlaybackManifestDto> {
    const playlist = await this.prisma.playlist.findUnique({
      where: {
        id: playlistId,
      },

      include: {
        device: {
          select: {
            id: true,
            deviceCode: true,
          },
        },

        items: {
          orderBy: {
            position: 'asc',
          },

          include: {
            mediaAsset: true,
            campaign: true,
          },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    const items = playlist.items.map((item) => ({
      playlistItemId: item.id,

      position: item.position,

      campaignId: item.campaignId,

      mediaAssetId: item.mediaAsset?.id ?? null,

      mimeType: item.mediaAsset?.mimeType ?? null,

      mediaUrl: item.mediaAsset?.publicUrl ?? null,

      checksum: item.mediaAsset?.checksum ?? null,

      durationSeconds: item.durationSeconds,

      type: item.type,
    }));

    return {
      deviceId: playlist.deviceId,

      playlistId: playlist.id,

      version: playlist.version,

      generatedAt: new Date(),

      items,
    };
  }

  async getVersion(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: deviceId,
      },

      select: {
        playlistVersion: true,

        currentPlaylistId: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const manifest = await this.prisma.playlistManifest.findUnique({
      where: {
        playlistId: device.currentPlaylistId!,
      },

      select: {
        version: true,

        manifestHash: true,

        updatedAt: true,
      },
    });

    return {
      deviceId,

      playlistId: device.currentPlaylistId,

      playlistVersion: manifest?.version,

      manifestHash: manifest?.manifestHash,

      updatedAt: manifest?.updatedAt,
    };
  }

  async getManifest(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: deviceId,
      },

      select: {
        currentPlaylistId: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (!device.currentPlaylistId) {
      throw new BadRequestException('Device has no active playlist');
    }

    const manifest = await this.prisma.playlistManifest.findUnique({
      where: {
        playlistId: device.currentPlaylistId,
      },
    });

    if (!manifest) {
      throw new NotFoundException('Playlist manifest not published');
    }

    return {
      playlistId: manifest.playlistId,

      playlistVersion: manifest.version,

      manifestHash: manifest.manifestHash,

      generatedAt: manifest.updatedAt,

      manifest: manifest.manifest,
    };
  }

  async acknowledgeDeployment(dto: DeploymentAckDto) {
    await this.prisma.playbackDeployment.updateMany({
      where: {
        deviceId: dto.deviceId,

        playlistManifestId: dto.playlistManifestId,
      },

      data: {
        status: 'ACKNOWLEDGED',

        acknowledgedAt: new Date(),
      },
    });

    return {
      success: true,
      acknowledgedAt: new Date(),
    };
  }
}
