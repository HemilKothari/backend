import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  SkipThrottle,
  Throttle,
} from '@nestjs/throttler';

import { CurrentDevice } from './decorators/current-device.decorator';
import { PlayerApiKeyGuard } from './guards/player-api-key.guard';
import { PlayerThrottlerGuard } from './guards/player-throttler.guard';

import type { AuthenticatedDevice } from './interfaces/authenticated-device.interface';

import { ApiSecurity } from '@nestjs/swagger';

import { SyncRequestDto } from './dto/sync-request.dto';
import { PlayerRuntimeService } from './player-runtime.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { ManifestAckDto } from './dto/manifest-ack.dto';
import { CreateSyncDto } from '../telemetry/dto/create-sync.dto';

@Controller('player')
@SkipThrottle()
@UseGuards(
  PlayerApiKeyGuard,
  PlayerThrottlerGuard,
)
@Throttle({
  player: {
    ttl: 60000,
    limit: 60,
  },
})
@ApiSecurity('player-api-key')
export class PlayerRuntimeController {
  constructor(
    private readonly playerRuntimeService: PlayerRuntimeService,
  ) {}

  @Get('me')
  me(
    @CurrentDevice() device: AuthenticatedDevice,
  ) {
    return device;
  }

  @Get('sync')
  sync(
    @CurrentDevice() device: AuthenticatedDevice,
    @Query() dto: SyncRequestDto,
  ) {
    return this.playerRuntimeService.checkSync(
      device,
      dto,
    );
  }

  @Get('manifest')
  getManifest(
    @CurrentDevice() device: AuthenticatedDevice,
  ) {
    return this.playerRuntimeService.getManifest(device);
  }

  @Get('media/:mediaId')
  downloadMedia(
    @CurrentDevice() device: AuthenticatedDevice,
    @Param('mediaId') mediaId: string,
  ) {
    return this.playerRuntimeService.downloadMedia(
      device,
      mediaId,
    );
  }

  @Post('heartbeat')
  heartbeat(
    @CurrentDevice() device: AuthenticatedDevice,
    @Body() dto: HeartbeatDto,
  ) {
    return this.playerRuntimeService.heartbeat(
      device,
      dto,
    );
  }

  @Post('manifest/ack')
  acknowledgeManifest(
    @CurrentDevice() device: AuthenticatedDevice,
    @Body() dto: ManifestAckDto,
  ) {
    return this.playerRuntimeService.acknowledgeManifest(
      device,
      dto,
    );
  }

  @Post('sync')
  syncUpload(
    @CurrentDevice() device: AuthenticatedDevice,
    @Body() dto: CreateSyncDto,
  ) {
    return this.playerRuntimeService.uploadSync(
      device,
      dto,
    );
  }
}