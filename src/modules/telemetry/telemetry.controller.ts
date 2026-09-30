import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { TelemetryService } from './telemetry.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('telemetry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.OPERATIONS,
)
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('latest')
  getLatest() {
    return this.telemetryService.getLatest();
  }

  
  @Get('offline-devices')
  getOfflineDevices() {
    return this.telemetryService.getOfflineDevices();
  }
  
  @Get('live')
  getLiveStatus() {
    return this.telemetryService.getLiveStatus();
  }
  
  @Get('device/:deviceId')
  getByDevice(@Param('deviceId') deviceId: string) {
    return this.telemetryService.getByDevice(deviceId);
  }
}
