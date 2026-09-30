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

import { DriverPayoutService } from './driver-payout.service';

import { GenerateDriverPayoutDto } from './dto/generate-driver-payout.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('driver-payout')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverPayoutController {
  constructor(
    private readonly driverPayoutService: DriverPayoutService,
  ) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findAll() {
    return this.driverPayoutService.findAll();
  }

  @Get('rickshaw/:rickshawId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findByRickshaw(
    @Param('rickshawId') rickshawId: string,
  ) {
    return this.driverPayoutService.getByRickshaw(
      rickshawId,
    );
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findOne(@Param('id') id: string) {
    return this.driverPayoutService.findOne(id);
  }


  @Patch(':id/pay')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  markPaid(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.driverPayoutService.markPaid(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.driverPayoutService.remove(id, user);
  }
}