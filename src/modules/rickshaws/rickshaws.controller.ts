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

import { RickshawsService } from './rickshaws.service';
import { CreateRickshawDto } from './dto/create-rickshaw.dto';
import { UpdateRickshawDto } from './dto/update-rickshaw.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('rickshaws')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RickshawsController {
  constructor(
    private readonly rickshawsService: RickshawsService,
  ) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  create(@Body() dto: CreateRickshawDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rickshawsService.create(dto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  findAll() {
    return this.rickshawsService.findAll();
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
    return this.rickshawsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRickshawDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rickshawsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rickshawsService.remove(id, user);
  }
}