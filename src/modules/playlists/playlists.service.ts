import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PlaybackDeploymentService } from '../playback-deployment/playback-deployment.service';

@Injectable()
export class PlaylistsService {
  constructor(
    private prisma: PrismaService,

    private PlaybackDeploymentService: PlaybackDeploymentService,
  ) {}

  async getAssignedCampaigns(deviceId: string) {
    const assignments = await this.prisma.campaignAssignment.findMany({
      where: {
        deviceId,

        status: 'ACTIVE',

        campaign: {
          status: 'ACTIVE',

          startDate: {
            lte: new Date(),
          },

          endDate: {
            gte: new Date(),
          },
        },
      },

      include: {
        campaign: {
          include: {
            mediaAsset: true,
          },
        },
      },
    });

    return assignments.map((assignment) => assignment.campaign);
  }

  calculateSlotUsage(campaigns: any[]) {
    let totalSlotsUsed = 0;

    const campaignBreakdown = campaigns.map((campaign) => {
      const slotsUsed = campaign.totalSlotsPerLoop ?? 0;

      totalSlotsUsed += slotsUsed;

      return {
        campaignId: campaign.id,

        campaignName: campaign.campaignName,

        frequency: campaign.frequencyPerLoop,

        durationSeconds: campaign.durationSeconds,

        totalSlotsUsed: slotsUsed,
      };
    });

    return {
      totalSlotsUsed,

      availableSlots: 60 - totalSlotsUsed,

      campaignBreakdown,
    };
  }

  validateCapacity(totalSlotsUsed: number) {
    if (totalSlotsUsed > 60) {
      throw new BadRequestException(
        `Playlist capacity exceeded. Required ${totalSlotsUsed}/60 slots.`,
      );
    }

    return true;
  }

  async generatePreview(deviceId: string) {
    const campaigns = await this.getAssignedCampaigns(deviceId);

    const slotUsage = this.calculateSlotUsage(campaigns);

    this.validateCapacity(slotUsage.totalSlotsUsed);

    const houseAd = await this.getHouseAd();

    const slots = this.fillHouseAds(this.generateSlots(campaigns), houseAd);

    return {
      status: 'VALID',

      totalSlotsUsed: slotUsage.totalSlotsUsed,

      availableSlots: slotUsage.availableSlots,

      slotCount: slots.length,

      slots,
    };
  }

  private buildCampaignPool(campaigns: any[]) {
    const pool: any[] = [];

    for (const campaign of campaigns) {
      const appearances = campaign.frequencyPerLoop;

      const slotsRequired = Math.ceil(campaign.durationSeconds / 10);

      for (let i = 0; i < appearances; i++) {
        pool.push({
          campaignId: campaign.id,

          campaignName: campaign.campaignName,

          mediaAsset: campaign.mediaAsset,

          durationSeconds: campaign.durationSeconds,

          slotsRequired,

          priority: campaign.priority,
        });
      }
    }

    return pool;
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  generateSlots(campaigns: any[]) {
    const TOTAL_SLOTS = 60;

    const slots = Array(TOTAL_SLOTS).fill(null);

    const pool = this.shuffle(this.buildCampaignPool(campaigns));

    let currentPosition = 0;

    for (const item of pool) {
      const size = item.slotsRequired;

      while (currentPosition < TOTAL_SLOTS) {
        let canFit = true;

        for (let i = 0; i < size; i++) {
          if (
            currentPosition + i >= TOTAL_SLOTS ||
            slots[currentPosition + i]
          ) {
            canFit = false;
            break;
          }
        }

        if (canFit) {
          for (let i = 0; i < size; i++) {
            slots[currentPosition + i] = item;
          }

          currentPosition += size;
          break;
        }

        currentPosition++;
      }
    }

    return slots;
  }

  private async getHouseAd() {
    const houseAd = await this.prisma.mediaAsset.findFirst({
      where: {
        isHouseAd: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!houseAd) {
      throw new BadRequestException('No House Ad configured.');
    }

    return houseAd;
  }

  fillHouseAds(slots: any[], houseAd: any) {
    return slots.map((slot, index) => {
      if (slot) {
        return slot;
      }

      return {
        campaignId: null,

        campaignName: 'HOUSE_AD',

        mediaAsset: houseAd,

        position: index + 1,

        durationSeconds: houseAd.durationSeconds ?? 10,

        type: 'HOUSE',
      };
    });
  }

  private generateVersion() {
    const timestamp = Date.now();

    return `V${timestamp}`;
  }

  async createPlaylistForDevice(deviceId: string) {
    const campaigns = await this.getAssignedCampaigns(deviceId);

    const slotUsage = this.calculateSlotUsage(campaigns);

    this.validateCapacity(slotUsage.totalSlotsUsed);

    const houseAd = await this.getHouseAd();

    const slots = this.fillHouseAds(this.generateSlots(campaigns), houseAd);

    const version = this.generateVersion();

    await this.prisma.playlist.updateMany({
      where: {
        deviceId,

        status: 'ACTIVE',
      },

      data: {
        status: 'ARCHIVED',
      },
    });

    const playlist = await this.prisma.playlist.create({
      data: {
        deviceId,
        version,
        totalSlots: 60,
        status: 'ACTIVE',
      },
    });

    await this.prisma.playlistItem.createMany({
      data: slots.map((slot, index) => ({
        playlistId: playlist.id,

        campaignId: slot.campaignId,

        mediaId: slot.mediaAsset.id,

        position: index + 1,

        durationSeconds: slot.durationSeconds,

        type: slot.campaignId ? 'CAMPAIGN' : 'HOUSE',
      })),
    });

    await this.prisma.device.update({
      where: {
        id: deviceId,
      },
      data: {
        playlistVersion: version,

        currentPlaylistId: playlist.id,
      },
    });

    await this.PlaybackDeploymentService.deployPlaylist(playlist.id);

    return {
      success: true,

      playlistId: playlist.id,

      version,

      slotCount: slots.length,
    };
  }

  async generateForFleet() {
    const devices = await this.prisma.device.findMany({
      where: {
        status: 'ONLINE',
      },
    });

    type PlaylistGenerationResult = {
      success: boolean;
      playlistId: string;
      version: string;
      slotCount: number;
    };

    const results: PlaylistGenerationResult[] = [];

    for (const device of devices) {
      const result = await this.createPlaylistForDevice(device.id);

      results.push(result);
    }

    // await PlaybackDeploymentService.deployPlaylist(playlist.id);

    return {
      devicesProcessed: results.length,
    };
  }

  async getCurrentPlaylist(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: deviceId,
      },

      include: {
        currentPlaylist: {
          include: {
            items: {
              include: {
                mediaAsset: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
      },
    });

    return device?.currentPlaylist;
  }
}
