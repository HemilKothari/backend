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

import { AdvertisersService } from './advertisers.service';
import { CreateAdvertiserDto } from './dto/create-advertiser.dto';
import { UpdateAdvertiserDto } from './dto/update-advertiser.dto';
import { RegisterAdvertiserDto } from './dto/register-advertiser.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '@prisma/client';

@Controller('advertisers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdvertisersController {
  constructor(
    private readonly advertisersService: AdvertisersService,
  ) {}

  /**
   * Internal advertiser creation.
   * Used by platform staff to create an advertiser account.
   */
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  create(
    @Body() dto: CreateAdvertiserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.advertisersService.create(dto, user);
  }

  /**
   * Self-registration as an advertiser.
   *
   * VIEWER → ADVERTISER
   */
  @Post('register')
  @Roles(UserRole.VIEWER)
  register(
    @Body() dto: RegisterAdvertiserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.advertisersService.register(dto, user);
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
    return this.advertisersService.findAll(user);
  }

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
    return this.advertisersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdvertiserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.advertisersService.update(id, dto, user);
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
    return this.advertisersService.remove(id, user);
  }
}