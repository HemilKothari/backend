import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
  ) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  create(@Body() dto: CreateDeviceDto, @Req() req: AuthenticatedRequest) {
    return this.devicesService.create(dto, req.user.id, req.user.role);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.devicesService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.devicesService.remove(id, req.user.id, req.user.role);
  }
}