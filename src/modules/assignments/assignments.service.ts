import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private playlistsService: PlaylistsService,
  ) {}

  async assignCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const eligibleDevices = await this.findEligibleDevices(
      campaign.totalSlotsPerLoop ?? 0,
    );

    if (eligibleDevices.length < campaign.fleetSize) {
      throw new BadRequestException(
        `Only ${eligibleDevices.length} devices have enough inventory for this campaign`,
      );
    }

    const selectedDevices = eligibleDevices.slice(0, campaign.fleetSize);

    await this.prisma.campaignAssignment.createMany({
      data: selectedDevices.map(({ device }) => ({
        campaignId,

        deviceId: device.id,
      })),

      skipDuplicates: true,
    });

    return {
      assignedDevices: selectedDevices.length,

      devices: selectedDevices.map(({ device, inventory }) => ({
        ...device,

        availableSlots: inventory.availableSlots,
      })),
    };
  }

  async getDeviceInventory(device: any) {
    const assignments = await this.prisma.campaignAssignment.findMany({
      where: {
        deviceId: device.id,
        status: 'ACTIVE',
      },

      include: {
        campaign: {
          include: {
            mediaAsset: true,
          },
        },
      },
    });

    const usedSlots = assignments.reduce(
      (sum, assignment) => sum + (assignment.campaign.totalSlotsPerLoop ?? 0),
      0,
    );

    return {
      deviceId: device.id,

      deviceCode: device.deviceCode,

      campaignCount: assignments.length,

      totalSlots: 60,

      usedSlots,

      availableSlots: 60 - usedSlots,
    };
  }

  async getFleetInventory() {
    const devices = await this.prisma.device.findMany({
      where: {
        status: 'ONLINE',
      },
    });

    const inventory: any[] = [];

    for (const device of devices) {
      inventory.push(await this.getDeviceInventory(device));
    }

    return inventory;
  }

  async findEligibleDevices(requiredSlots: number) {
    const devices = await this.prisma.device.findMany({
      where: {
        status: 'ONLINE',
      },
    });

    const eligible: any[] = [];

    for (const device of devices) {
      const inventory = await this.getDeviceInventory(device.id);

      if (inventory.availableSlots >= requiredSlots) {
        eligible.push({
          device,
          inventory,
        });
      }
    }

    return eligible.sort(
      (a, b) => b.inventory.availableSlots - a.inventory.availableSlots,
    );
  }

  async validateRebalance(fleetSize: number, requiredSlots: number) {
    const eligibleDevices = await this.findEligibleDevices(requiredSlots);

    if (eligibleDevices.length < fleetSize) {
      throw new BadRequestException(
        `Campaign requires ${fleetSize} devices but only ${eligibleDevices.length} devices have sufficient inventory`,
      );
    }

    const selectedDevices = eligibleDevices.slice(0, fleetSize);

    return {
      eligibleDevices,
      selectedDevices,
    };
  }

  async rebalanceCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const { selectedDevices } = await this.validateRebalance(
      campaign.fleetSize,
      campaign.totalSlotsPerLoop ?? 0,
    );

    await this.prisma.campaignAssignment.deleteMany({
      where: {
        campaignId,
      },
    });

    await this.prisma.campaignAssignment.createMany({
      data: selectedDevices.map(({ device }) => ({
        campaignId,
        deviceId: device.id,
      })),
    });

    for (const { device } of selectedDevices) {
      await this.playlistsService.createPlaylistForDevice(device.id);
    }

    return {
      campaignId,

      rebalancedDevices: selectedDevices.length,
    };
  }
}
