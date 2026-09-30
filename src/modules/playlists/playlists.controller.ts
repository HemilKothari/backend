import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { PlaylistsService } from './playlists.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('playlists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get('current/:deviceId')
  async getCurrentPlaylist(
    @Param('deviceId')
    deviceId: string,
  ) {
    return this.playlistsService.getCurrentPlaylist(deviceId);
  }
}
