import { Module } from '@nestjs/common';

import { PlaylistsService } from './playlists.service';
import { PlaylistsController } from './playlists.controller';

import { PrismaModule } from '../../prisma/prisma.module';
import { PlaybackDeploymentModule } from '../playback-deployment/playback-deployment.module';

@Module({
  imports: [
    PrismaModule,
    PlaybackDeploymentModule, // IMPORTANT
  ],

  controllers: [PlaylistsController],

  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}