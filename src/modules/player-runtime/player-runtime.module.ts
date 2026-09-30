import { Module } from '@nestjs/common';

import { PlayerRuntimeService } from './player-runtime.service';

import { PlayerRuntimeController } from './player-runtime.controller';
import { PlayerProvisionController } from './player-provision.controller';

import { PlayerApiKeyGuard } from './guards/player-api-key.guard';
import { PlayerThrottlerGuard } from './guards/player-throttler.guard';

import { DriverActivityModule } from '../driver-activity/driver-activity.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    DriverActivityModule,
  ],

  providers: [
    PlayerRuntimeService,
    PlayerApiKeyGuard,
    PlayerThrottlerGuard,
  ],

  controllers: [
    PlayerRuntimeController,
    PlayerProvisionController,
  ],
})
export class PlayerRuntimeModule {}