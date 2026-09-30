import { Module } from '@nestjs/common';

import { PlaybackDeploymentService } from './playback-deployment.service';
import { PlaybackDeploymentController } from './playback-deployment.controller';

import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [PlaybackDeploymentController],

  providers: [PlaybackDeploymentService],

  exports: [PlaybackDeploymentService], // IMPORTANT
})
export class PlaybackDeploymentModule {}