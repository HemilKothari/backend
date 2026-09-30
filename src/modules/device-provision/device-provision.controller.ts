import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { DeviceProvisionService } from './device-provision.service';
import { CreateDeviceProvisionDto } from './dto/create-device-provision.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('device-provision')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceProvisionController {
  constructor(
    private readonly deviceProvisionService: DeviceProvisionService,
  ) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  create(@Body() dto: CreateDeviceProvisionDto, @Req() req: AuthenticatedRequest) {
    return this.deviceProvisionService.create(dto, req.user.id, req.user.role);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findAll() {
    return this.deviceProvisionService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findOne(@Param('id') id: string) {
    return this.deviceProvisionService.findOne(id);
  }

  @Post(':id/activate')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  activate(@Param('id') id: string) {
    return this.deviceProvisionService.activate(id);
  }
}