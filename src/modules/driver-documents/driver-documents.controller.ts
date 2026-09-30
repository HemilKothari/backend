import { Type } from 'class-transformer';
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

import { DriverDocumentsService } from './driver-documents.service';

import { CreateDriverDocumentDto } from './dto/create-driver-document.dto';
import { VerifyDriverDocumentDto } from './dto/verify-driver-document.dto';
import { UpdateDriverDocumentDto } from './dto/update-driver-document.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('driver-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverDocumentsController {
  constructor(
    private readonly driverDocumentsService: DriverDocumentsService,
  ) {}

  // Driver uploads their own document
  @Post()
  @Roles(UserRole.DRIVER)
  create(
    @Body() dto: CreateDriverDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverDocumentsService.createForDriver(
      dto,
      user,
    );
  }

  // Internal staff uploads a document on behalf of a driver
  @Post('driver/:driverId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  createForDriver(
    @Param('driverId') driverId: string,
    @Body() dto: CreateDriverDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverDocumentsService.createForDriverByStaff(
      driverId,
      dto,
      user,
    );
  }

  // Internal staff only
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findAll() {
    return this.driverDocumentsService.findAll();
  }

  // Internal staff can inspect any driver.
  // Driver can inspect only themselves.
  @Get('driver/:driverId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.DRIVER,
  )
  findByDriver(
    @Param('driverId') driverId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverDocumentsService.findByDriver(
      driverId,
      user,
    );
  }

  // Driver can view only their own document
  // Internal staff can view any document
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
    return this.driverDocumentsService.findOne(
      id,
      user,
    );
  }

  // Only internal staff can verify
  @Patch(':id/verify')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyDriverDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverDocumentsService.verify(
      id,
      dto,
      user,
    );
  }

  // Driver can update own document.
  // Internal staff can update any document.
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.DRIVER,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.driverDocumentsService.update(
      id,
      dto,
      user,
    );
  }

  // SUPER_ADMIN and ADMIN only
  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.driverDocumentsService.remove(id, user);
  }
}