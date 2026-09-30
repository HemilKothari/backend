import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PlaybackDeploymentService } from './playback-deployment.service';
import { DeploymentAckDto } from './dto/deployment-ack.dto';

@Controller('deployment')
export class PlaybackDeploymentController {
  constructor(
    private readonly playbackDeploymentService: PlaybackDeploymentService,
  ) {}

  @Get('version/:deviceId')
  getVersion(@Param('deviceId') deviceId: string) {
    return this.playbackDeploymentService.getVersion(deviceId);
  }

  @Get('manifest/:deviceId')
  getManifest(@Param('deviceId') deviceId: string) {
    return this.playbackDeploymentService.getManifest(deviceId);
  }
}
