import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PlaylistsService } from '../playlists/playlists.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { UpdateCreativeDto } from './dto/update-creative.dto';
import { ModifyCampaignDto } from './dto/modify-campaign.dto';
import { MediaService } from '../media/media.service';
import { ReportsService } from '../reports/reports.service';
import { CampaignReport, UserRole } from '@prisma/client';
import { ExpiringCampaign } from './interfaces/expiring-campaign.interface';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
  constructor(
    private prisma: PrismaService,
    private assignmentsService: AssignmentsService,
    private playlistsService: PlaylistsService,
    private reportsService: ReportsService,
    private auditService: AuditService,
  ) {}

  private async getCampaignForUser(
    campaignId: string,
    user: AuthenticatedUser,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,

        ...(user.role === UserRole.ADVERTISER
          ? {
              advertiserId: user.advertiserId ?? '__NO_ADVERTISER__',
            }
          : {}),
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async create(dto: CreateCampaignDto, user: AuthenticatedUser) {
    let advertiserId = dto.advertiserId;

    if (user.role === 'ADVERTISER') {
      if (!user.advertiserId) {
        throw new ForbiddenException(
          'User is not associated with an advertiser.',
        );
      }

      advertiserId = user.advertiserId;
    }
    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: {
        id: dto.mediaAssetId,
      },
    });

    if (!mediaAsset) {
      throw new NotFoundException('Media asset not found');
    }

    if (
      user.role === 'ADVERTISER' &&
      mediaAsset.advertiserId !== advertiserId
    ) {
      throw new NotFoundException('Media asset not found');
    }

    const slotsRequired = Math.ceil((mediaAsset.durationSeconds ?? 10) / 10);

    const totalSlotsPerLoop = dto.frequencyPerLoop * slotsRequired;

    if (totalSlotsPerLoop > 30) {
      throw new BadRequestException(
        'Campaign exceeds maximum inventory allocation',
      );
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        campaignName: dto.campaignName,

        advertiser: {
          connect: {
            id: advertiserId,
          },
        },

        mediaAsset: {
          connect: {
            id: dto.mediaAssetId,
          },
        },

        durationDays: dto.durationDays,

        frequencyPerLoop: dto.frequencyPerLoop,

        fleetSize: dto.fleetSize,

        durationSeconds: mediaAsset.durationSeconds!,

        totalSlotsPerLoop,

        creativeChangesAllowed: dto.creativeChangesAllowed ?? 3,

        creativeChangesUsed: 0,
      },

      include: {
        mediaAsset: true,
        advertiser: true,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.CAMPAIGN_CREATED,
      entityType: 'Campaign',
      entityId: campaign.id,
      metadata: {
        advertiserId: campaign.advertiserId,
        campaignName: campaign.campaignName,
        mediaAssetId: campaign.mediaAssetId,
        durationDays: campaign.durationDays,
        frequencyPerLoop: campaign.frequencyPerLoop,
        fleetSize: campaign.fleetSize,
      },
    });

    return campaign;
  }

  async findAll(user: AuthenticatedUser) {
    const where =
      user.role === 'ADVERTISER'
        ? {
            advertiserId: user.advertiserId!,
          }
        : undefined;

    return this.prisma.campaign.findMany({
      where,
      include: {
        advertiser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const where =
      user.role === 'ADVERTISER'
        ? {
            id,
            advertiserId: user.advertiserId!,
          }
        : {
            id,
          };

    const campaign = await this.prisma.campaign.findFirst({
      where,
      include: {
        advertiser: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const deletedCampaign = await this.prisma.campaign.delete({
      where: { id },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.CAMPAIGN_DELETED,
      entityType: 'Campaign',
      entityId: deletedCampaign.id,
      metadata: {
        campaignName: campaign.campaignName,
        advertiserId: campaign.advertiserId,
        previousStatus: campaign.status,
      },
    });

    return deletedCampaign;
  }

  private calculateCampaignEndDate(startDate: Date, durationDays: number) {
    return new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  }

  async activate(id: string, user: AuthenticatedUser) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },

      include: {},
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Only draft campaigns can be activated');
    }

    await this.assignmentsService.validateRebalance(
      campaign.fleetSize,
      campaign.totalSlotsPerLoop!,
    );

    const startDate = new Date();

    const endDate = this.calculateCampaignEndDate(
      startDate,
      campaign.durationDays,
    );

    await this.prisma.campaign.update({
      where: { id },

      data: {
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    const assignmentResult = await this.assignmentsService.assignCampaign(id);

    let playlistsGenerated = 0;

    try {
      for (const device of assignmentResult.devices) {
        await this.playlistsService.createPlaylistForDevice(device.id);
        playlistsGenerated++;
      }

      await this.auditService.log({
        actorUserId: user.id,
        actorUserRole: user.role,
        action: AuditAction.CAMPAIGN_ACTIVATED,
        entityType: 'Campaign',
        entityId: id,
        metadata: {
          assignedDevices: assignmentResult.assignedDevices,
          playlistsGenerated,
          startDate,
          endDate,
        },
      });
    } catch (error) {
      await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'DRAFT',
          startDate: null,
          endDate: null,
        },
      });

      await this.prisma.campaignAssignment.deleteMany({
        where: {
          campaignId: id,
        },
      });

      throw error;
    }

    return {
      success: true,

      campaignId: id,

      status: 'ACTIVE',

      startDate,

      endDate,

      assignedDevices: assignmentResult.assignedDevices,

      devices: assignmentResult.devices.map((device) => ({
        id: device.deviceCode,
      })),

      playlistsGenerated,
    };
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status === 'COMPLETED') {
      throw new BadRequestException('Completed campaign cannot be cancelled');
    } else if (campaign.status === 'CANCELLED') {
      throw new BadRequestException('Campaign is already cancelled');
    } else if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException('Only active campaigns can be cancelled');
    }

    await this.prisma.campaign.update({
      where: { id },

      data: {
        status: 'CANCELLED',
      },
    });

    await this.prisma.campaignAssignment.updateMany({
      where: {
        campaignId: id,
        status: 'ACTIVE',
      },

      data: {
        status: 'CANCELLED',
      },
    });

    const assignments = await this.prisma.campaignAssignment.findMany({
      where: {
        campaignId: id,
      },

      select: {
        deviceId: true,
      },
    });

    const deviceIds = [...new Set(assignments.map((a) => a.deviceId))];

    for (const deviceId of deviceIds) {
      await this.playlistsService.createPlaylistForDevice(deviceId);
    }

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.CAMPAIGN_CANCELLED,
      entityType: 'Campaign',
      entityId: id,
      metadata: {
        affectedDevices: assignments.length,
      },
    });

    return {
      success: true,
      campaignId: id,
      status: 'CANCELLED',
      affectedDevices: assignments.length,
    };
  }

  async complete(id: string, user?: AuthenticatedUser) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled campaign cannot be completed');
    } else if (campaign.status === 'COMPLETED') {
      throw new BadRequestException('Campaign already completed');
    } else if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException('Only active campaigns can be completed');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'COMPLETING',
      },
    });

    let assignments: { deviceId: string }[] = [];
    let report: CampaignReport;

    try {
      assignments = await this.prisma.campaignAssignment.findMany({
        where: {
          campaignId: id,
        },

        select: {
          deviceId: true,
        },
      });

      report = await this.reportsService.generateFinalReportInternal(id);

      await this.prisma.$transaction(async (tx) => {
        await tx.campaignAssignment.updateMany({
          where: {
            campaignId: id,
            status: 'ACTIVE',
          },

          data: {
            status: 'COMPLETED',
          },
        });

        await tx.campaign.update({
          where: { id },

          data: {
            status: 'COMPLETED',
          },
        });
      });
    } catch (error) {
      await this.prisma.campaign.update({
        where: { id },
        data: {
          status: 'ACTIVE',
        },
      });

      throw error;
    }

    const deviceIds = [...new Set(assignments.map((a) => a.deviceId))];

    for (const deviceId of deviceIds) {
      try {
        await this.playlistsService.createPlaylistForDevice(deviceId);

        await this.auditService.log({
          actorUserId: user?.id,
          actorUserRole: user?.role,
          action: AuditAction.CAMPAIGN_COMPLETED,
          entityType: 'Campaign',
          entityId: id,
          metadata: {
            reportId: report.id,
            affectedDevices: assignments.length,
            completedAutomatically: !user,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed regenerating playlist for ${deviceId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return {
      success: true,
      campaignId: id,
      status: 'COMPLETED',
      reportId: report.id,
      affectedDevices: assignments.length,
    };
  }

  async getExpiringCampaigns(days = 7) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + days);

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',

        endDate: {
          not: null,
          gte: today,
          lte: weekEnd,
        },
      },

      orderBy: {
        endDate: 'asc',
      },

      include: {
        advertiser: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
    });

    const result: {
      today: ExpiringCampaign[];
      tomorrow: ExpiringCampaign[];
      thisWeek: ExpiringCampaign[];
    } = {
      today: [],
      tomorrow: [],
      thisWeek: [],
    };

    for (const campaign of campaigns) {
      const endDate = new Date(campaign.endDate!);

      endDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      const campaignData: ExpiringCampaign = {
        id: campaign.id,

        campaignName: campaign.campaignName,

        endDate: campaign.endDate,

        daysRemaining: diffDays,
      };

      if (diffDays === 0) {
        result.today.push(campaignData);
      } else if (diffDays === 1) {
        result.tomorrow.push(campaignData);
      } else {
        result.thisWeek.push(campaignData);
      }
    }

    return {
      counts: {
        today: result.today.length,
        tomorrow: result.tomorrow.length,
        thisWeek: result.thisWeek.length,
      },

      campaigns: result,
    };
  }

  async getPublicActiveCampaigns() {
    const now = new Date();

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',

        startDate: {
          lte: now,
        },

        endDate: {
          gte: now,
        },
      },

      select: {
        id: true,
        campaignName: true,

        mediaAsset: {
          select: {
            publicUrl: true,
            mimeType: true,
            durationSeconds: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });

    return campaigns
      .filter((campaign) => campaign.mediaAsset !== null)
      .map((campaign) => ({
        id: campaign.id,
        campaignName: campaign.campaignName,
        mediaAsset: {
          publicUrl: campaign.mediaAsset!.publicUrl,
          mimeType: campaign.mediaAsset!.mimeType,
          durationSeconds: campaign.mediaAsset!.durationSeconds,
        },
      }));
  }

  async updateCreative(
    campaignId: string,
    dto: UpdateCreativeDto,
    user: AuthenticatedUser,
  ) {
    const campaign = await this.getCampaignForUser(campaignId, user);

    // Advertiser must own the new media asset.
    if (user.role === UserRole.ADVERTISER) {
      const mediaAsset = await this.prisma.mediaAsset.findFirst({
        where: {
          id: dto.mediaAssetId,
          advertiserId: user.advertiserId!,
        },
      });

      if (!mediaAsset) {
        throw new NotFoundException('Media asset not found');
      }
    }

    if (campaign.creativeChangesUsed >= campaign.creativeChangesAllowed) {
      throw new BadRequestException('Creative change limit reached');
    }

    const slotsRequired = Math.ceil(
      (dto.imageDurationSeconds ? dto.imageDurationSeconds : 10) / 10,
    );

    const proposedSlots = campaign.frequencyPerLoop * slotsRequired;

    await this.assignmentsService.validateRebalance(
      campaign.fleetSize,
      proposedSlots,
    );

    const previousMediaAssetId = campaign.mediaAssetId;

    const previousDuration = campaign.durationSeconds;

    const previousSlots = campaign.totalSlotsPerLoop;

    const previousCreativeChangesUsed = campaign.creativeChangesUsed;

    const updatedCampaign = await this.prisma.campaign.update({
      where: {
        id: campaignId,
      },

      data: {
        mediaAssetId: dto.mediaAssetId,

        durationSeconds: dto.imageDurationSeconds,

        totalSlotsPerLoop: proposedSlots,

        creativeChangesUsed: {
          increment: 1,
        },
      },
    });

    if (campaign.status === 'ACTIVE') {
      try {
        await this.assignmentsService.rebalanceCampaign(campaignId);
      } catch (error) {
        await this.prisma.campaign.update({
          where: {
            id: campaignId,
          },

          data: {
            mediaAssetId: previousMediaAssetId,

            durationSeconds: previousDuration,

            totalSlotsPerLoop: previousSlots,

            creativeChangesUsed: previousCreativeChangesUsed,
          },
        });

        throw error;
      }
    }

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.CAMPAIGN_CREATIVE_UPDATED,
      entityType: 'Campaign',
      entityId: updatedCampaign.id,
      metadata: {
        previousMediaAssetId,
        newMediaAssetId: updatedCampaign.mediaAssetId,

        previousDurationSeconds: previousDuration,
        newDurationSeconds: updatedCampaign.durationSeconds,

        previousSlotsPerLoop: previousSlots,
        newSlotsPerLoop: updatedCampaign.totalSlotsPerLoop,

        creativeChangesUsed: updatedCampaign.creativeChangesUsed,

        creativeChangesAllowed: updatedCampaign.creativeChangesAllowed,
      },
    });

    return updatedCampaign;
  }

  async modifyCampaign(
    campaignId: string,
    dto: ModifyCampaignDto,
    user: AuthenticatedUser,
  ) {
    const campaign = await this.getCampaignForUser(campaignId, user);

    if (campaign.status === 'COMPLETED') {
      throw new BadRequestException('Completed campaigns cannot be modified');
    }

    if (campaign.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled campaigns cannot be modified');
    }

    const proposedFleetSize = dto.fleetSize ?? campaign.fleetSize;

    const proposedFrequency = dto.frequencyPerLoop ?? campaign.frequencyPerLoop;

    const proposedSlots =
      proposedFrequency * Math.ceil(campaign.durationSeconds / 10);

    await this.assignmentsService.validateRebalance(
      proposedFleetSize,
      proposedSlots,
    );

    const updatedCampaign = await this.prisma.campaign.update({
      where: {
        id: campaignId,
      },

      data: {
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,

        fleetSize: dto.fleetSize,

        frequencyPerLoop: dto.frequencyPerLoop,

        priority: dto.priority,

        totalSlotsPerLoop: proposedSlots,
      },
    });

    if (campaign.status === 'ACTIVE') {
      await this.assignmentsService.rebalanceCampaign(campaignId);
    }

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.CAMPAIGN_UPDATED,
      entityType: 'Campaign',
      entityId: updatedCampaign.id,
      metadata: {
        updatedFields: Object.keys(dto),
        previousFleetSize: campaign.fleetSize,
        newFleetSize: updatedCampaign.fleetSize,
        previousFrequencyPerLoop: campaign.frequencyPerLoop,
        newFrequencyPerLoop: updatedCampaign.frequencyPerLoop,
        previousEndDate: campaign.endDate,
        newEndDate: updatedCampaign.endDate,
      },
    });

    return updatedCampaign;
  }

  async completeExpiredCampaigns() {
    const expiredCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',

        endDate: {
          lt: new Date(),
        },
      },
    });

    for (const campaign of expiredCampaigns) {
      await this.complete(campaign.id);
    }

    return {
      completed: expiredCampaigns.length,
    };
  }
}
