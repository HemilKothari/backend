import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CampaignsService } from './campaigns.service';

import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCreativeDto } from './dto/update-creative.dto';
import { ModifyCampaignDto } from './dto/modify-campaign.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { UserRole } from '@prisma/client';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
  ) {}

  // =========================================================
  // CREATE
  // =========================================================

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  create(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.create(dto, user);
  }

  // =========================================================
  // VIEW ALL
  // =========================================================

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.findAll(user);
  }

  // =========================================================
  // EXPIRING
  // =========================================================

  @Get('expiring')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  getExpiringCampaigns(
    @Query('days') days?: number,
  ) {
    return this.campaignsService.getExpiringCampaigns(days);
  }

  // =========================================================
  // VIEW ONE
  // =========================================================

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.findOne(id, user);
  }

  // =========================================================
  // DELETE
  // =========================================================

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.remove(id, user);
  }

  // =========================================================
  // ACTIVATE
  // =========================================================

  @Post(':id/activate')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  activate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.activate(id, user);
  }

  // =========================================================
  // CANCEL
  // =========================================================

  @Post(':id/cancel')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.cancel(id, user);
  }

  // =========================================================
  // COMPLETE
  // =========================================================

  @Post(':id/complete')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.complete(id, user);
  }

  // =========================================================
  // UPDATE CREATIVE
  // =========================================================

  @Post(':id/update-creative')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  updateCreative(
    @Param('id') id: string,
    @Body() dto: UpdateCreativeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.updateCreative(
      id,
      dto,
      user,
    );
  }

  // =========================================================
  // MODIFY CAMPAIGN
  // =========================================================

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  modifyCampaign(
    @Param('id') id: string,
    @Body() dto: ModifyCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.modifyCampaign(
      id,
      dto,
      user,
    );
  }
}