import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DriversService } from './drivers.service';

import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '@prisma/client';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
  ) {}

  /**
   * Internal/admin creation.
   */
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  create(
    @Body() dto: CreateDriverDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driversService.create(dto, user);
  }

  /**
   * Self-registration:
   *
   * VIEWER → DRIVER
   */
  @Post('register')
  @Roles(UserRole.VIEWER)
  register(
    @Body() dto: CreateDriverDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driversService.register(dto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driversService.findAll(user);
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
    return this.driversService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.DRIVER,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driversService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driversService.remove(id, user);
  }
}