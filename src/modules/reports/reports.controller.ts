import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service';

import {
  ReportPeriod,
  ReportPeriodDto,
} from './dto/report-period.dto';

import { ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @ApiQuery({
    name: 'period',
    required: false,
    enum: ReportPeriod,
  })
  @Get('campaign/:campaignId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  getCampaignReport(
    @Param('campaignId') campaignId: string,
    @Query() query: ReportPeriodDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getCampaignReport(
      campaignId,
      query.period ?? ReportPeriod.LIFETIME,
      user,
    );
  }
}