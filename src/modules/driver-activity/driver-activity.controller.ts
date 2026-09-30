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

import { DriverActivityService } from './driver-activity.service';

import { CreateDriverActivityDto } from './dto/create-driver-activity.dto';
import { UpdateDriverActivityDto } from './dto/update-driver-activity.dto';
import { GetSummaryDto } from './dto/get-summary.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('driver-activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverActivityController {
  constructor(
    private readonly driverActivityService: DriverActivityService,
  ) {}

  // Internal users only
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findAll() {
    return this.driverActivityService.findAll();
  }

  // Driver can access only their assigned Rickshaw
  @Get('rickshaw/:rickshawId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.DRIVER,
  )
  findByRickshaw(
    @Param('rickshawId') rickshawId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverActivityService.findByRickshaw(
      rickshawId,
      user,
    );
  }

  @Get('rickshaw/:rickshawId/summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.DRIVER,
  )
  getSummary(
    @Param('rickshawId') rickshawId: string,
    @Query() dto: GetSummaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverActivityService.getSummary(
      rickshawId,
      dto,
      user,
    );
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.DRIVER,
  )
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverActivityService.findOne(
      id,
      user,
    );
  }

  // Driver cannot modify activity
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverActivityDto,
  ) {
    return this.driverActivityService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  remove(@Param('id') id: string) {
    return this.driverActivityService.remove(id);
  }
}