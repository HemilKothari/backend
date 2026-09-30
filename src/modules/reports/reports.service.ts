import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { ReportPeriod } from './dto/report-period.dto';
import { ReportType, UserRole } from '@prisma/client';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // PUBLIC / AUTHENTICATED REPORT VIEWING
  // =========================================================

  /**
   * Used by HTTP endpoints.
   *
   * SUPER_ADMIN / ADMIN / OPERATIONS:
   *   Can view any campaign report.
   *
   * ADVERTISER:
   *   Can only view reports belonging to their own campaigns.
   */
  async getCampaignReport(
    campaignId: string,
    period: ReportPeriod,
    user: AuthenticatedUser,
  ) {
    // 1. Verify the user can access this campaign.
    await this.getCampaignForUser(campaignId, user);

    // 2. Map requested period to stored report type.
    const reportType = this.getReportType(period);

    // 3. Read the already-generated snapshot.
    const report = await this.prisma.campaignReport.findFirst({
      where: {
        campaignId,
        reportType,
      },
      orderBy: {
        periodEnd: 'desc',
      },
    });

    if (!report) {
      throw new NotFoundException('Report has not been generated yet');
    }

    return {
      id: report.id,

      campaignId: report.campaignId,

      reportType: report.reportType,

      periodStart: report.periodStart,

      periodEnd: report.periodEnd,

      playbacks: report.playbacks,

      estimatedImpressions: report.estimatedImpressions,

      activeDevices: report.activeDevices,

      averagePlaybacksPerDevice: report.averagePlaybacksPerDevice,

      lastPlayback: report.lastPlayback,

      generatedAt: report.generatedAt,
    };
  }

  private getReportType(period: ReportPeriod): ReportType {
    switch (period) {
      case ReportPeriod.WEEK:
        return ReportType.WEEKLY;

      case ReportPeriod.MONTH:
        return ReportType.MONTHLY;

      case ReportPeriod.QUARTER:
        return ReportType.QUARTERLY;

      case ReportPeriod.LIFETIME:
        return ReportType.FINAL;

      default:
        throw new BadRequestException(
          'This report period is not available as a generated report',
        );
    }
  }

  /**
   * This method is ONLY for authenticated users.
   *
   * Advertiser ownership is enforced here.
   */
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

  // =========================================================
  // INTERNAL REPORT GENERATION
  // =========================================================

  /**
   * Used only by trusted backend code such as:
   *
   * - ReportsScheduler
   * - Campaign completion
   *
   * No AuthenticatedUser is required because these methods
   * are not exposed directly through an HTTP controller.
   */
  private async getCampaignInternal(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Core report calculation used internally.
   *
   * This does NOT perform user authorization.
   */
  private async calculateCampaignReport(
    campaignId: string,
    period: ReportPeriod,
  ) {
    const campaign = await this.getCampaignInternal(campaignId);

    if (!campaign.startDate || !campaign.endDate) {
      throw new BadRequestException('Campaign has not been activated yet');
    }

    const range =
      period === ReportPeriod.LIFETIME
        ? {
            start: campaign.startDate,
            end: campaign.endDate,
          }
        : this.getDateRange(period);

    if (!range) {
      throw new BadRequestException('Invalid report period');
    }

    const playbackCount = await this.getPlaybackCount(
      campaignId,
      range.start,
      range.end,
    );

    const activeDevices = await this.getActiveDevices(
      campaignId,
      range.start,
      range.end,
    );

    const lastPlayback = await this.getLastPlayback(
      campaignId,
      range.start,
      range.end,
    );

    return this.buildCampaignReport(
      campaign,
      period,
      range,
      playbackCount,
      activeDevices,
      lastPlayback,
    );
  }

  // =========================================================
  // INTERNAL GENERATION METHODS
  // =========================================================

  async generateWeeklyReportInternal(campaignId: string) {
    const report = await this.calculateCampaignReport(
      campaignId,
      ReportPeriod.WEEK,
    );

    return this.saveSnapshot(campaignId, ReportType.WEEKLY, report);
  }

  async generateMonthlyReportInternal(campaignId: string) {
    const report = await this.calculateCampaignReport(
      campaignId,
      ReportPeriod.MONTH,
    );

    return this.saveSnapshot(campaignId, ReportType.MONTHLY, report);
  }

  async generateQuarterlyReportInternal(campaignId: string) {
    const report = await this.calculateCampaignReport(
      campaignId,
      ReportPeriod.QUARTER,
    );

    return this.saveSnapshot(campaignId, ReportType.QUARTERLY, report);
  }

  /**
   * Called from campaign completion rather than HTTP.
   */
  async generateFinalReportInternal(campaignId: string) {
    const report = await this.calculateCampaignReport(
      campaignId,
      ReportPeriod.LIFETIME,
    );

    return this.saveSnapshot(campaignId, ReportType.FINAL, report);
  }

  // =========================================================
  // DATE RANGE
  // =========================================================

  private getDateRange(period: ReportPeriod) {
    const now = new Date();

    let start: Date;
    let end: Date;

    switch (period) {
      case ReportPeriod.TODAY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);

        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.WEEK: {
        const day = now.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;

        start = new Date(now);
        start.setDate(now.getDate() + mondayOffset);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case ReportPeriod.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);

        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        break;

      case ReportPeriod.QUARTER: {
        const quarter = Math.floor(now.getMonth() / 3);

        start = new Date(now.getFullYear(), quarter * 3, 1);

        end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        break;
      }

      default:
        return null;
    }

    return {
      start,
      end,
    };
  }

  // =========================================================
  // PLAYBACK AGGREGATION
  // =========================================================

  private async getPlaybackCount(campaignId: string, start: Date, end: Date) {
    return this.prisma.playbackEvent.count({
      where: {
        campaignId,

        playedAt: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  private async getActiveDevices(campaignId: string, start: Date, end: Date) {
    const devices = await this.prisma.playbackEvent.groupBy({
      by: ['deviceId'],

      where: {
        campaignId,

        playedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    return devices.length;
  }

  private async getLastPlayback(campaignId: string, start: Date, end: Date) {
    const playback = await this.prisma.playbackEvent.findFirst({
      where: {
        campaignId,

        playedAt: {
          gte: start,
          lte: end,
        },
      },

      orderBy: {
        playedAt: 'desc',
      },

      select: {
        playedAt: true,
      },
    });

    return playback?.playedAt ?? null;
  }

  // =========================================================
  // REPORT CALCULATIONS
  // =========================================================

  private getEstimatedImpressions(playbackCount: number) {
    const AVG_PASSENGERS_PER_PLAY = 3;

    return playbackCount * AVG_PASSENGERS_PER_PLAY;
  }

  private getAveragePlaybacksPerDevice(
    playbackCount: number,
    activeDevices: number,
  ) {
    if (activeDevices === 0) {
      return 0;
    }

    return Number((playbackCount / activeDevices).toFixed(2));
  }

  private buildCampaignReport(
    campaign: {
      id: string;
      campaignName: string;
    },
    period: ReportPeriod,
    range: {
      start: Date;
      end: Date;
    },
    playbackCount: number,
    activeDevices: number,
    lastPlayback: Date | null,
  ) {
    const estimatedImpressions = this.getEstimatedImpressions(playbackCount);

    const averagePlaybacksPerDevice = this.getAveragePlaybacksPerDevice(
      playbackCount,
      activeDevices,
    );

    return {
      campaignId: campaign.id,

      campaignName: campaign.campaignName,

      reportPeriod: period,

      periodStart: range.start,

      periodEnd: range.end,

      playbacks: playbackCount,

      activeDevices,

      estimatedImpressions,

      averagePlaybacksPerDevice,

      lastPlayback,
    };
  }

  // =========================================================
  // SNAPSHOT STORAGE
  // =========================================================

  private async saveSnapshot(
    campaignId: string,
    reportType: ReportType,
    report: {
      periodStart: Date;
      periodEnd: Date;
      playbacks: number;
      estimatedImpressions: number;
      activeDevices: number;
      averagePlaybacksPerDevice: number;
      lastPlayback: Date | null;
    },
  ) {
    return this.prisma.campaignReport.upsert({
      where: {
        campaignId_reportType_periodStart_periodEnd: {
          campaignId,
          reportType,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
        },
      },

      update: {
        playbacks: report.playbacks,

        estimatedImpressions: report.estimatedImpressions,

        activeDevices: report.activeDevices,

        averagePlaybacksPerDevice: report.averagePlaybacksPerDevice,

        lastPlayback: report.lastPlayback,
      },

      create: {
        campaignId,

        reportType,

        periodStart: report.periodStart,

        periodEnd: report.periodEnd,

        playbacks: report.playbacks,

        estimatedImpressions: report.estimatedImpressions,

        activeDevices: report.activeDevices,

        averagePlaybacksPerDevice: report.averagePlaybacksPerDevice,

        lastPlayback: report.lastPlayback,
      },
    });
  }
}
