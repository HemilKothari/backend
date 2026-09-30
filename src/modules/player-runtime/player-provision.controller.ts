import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import { PlayerRuntimeService } from './player-runtime.service';
import { ProvisionPlayerDto } from './dto/provision-player.dto';

@Controller('player')
export class PlayerProvisionController {
  constructor(
    private readonly playerRuntimeService: PlayerRuntimeService,
  ) {}

  @Post('provision')
  @Throttle({
    provision: {
      ttl: 60000,
      limit: 10,
    },
  })
  provision(
    @Body() dto: ProvisionPlayerDto,
  ) {
    return this.playerRuntimeService.provision(dto);
  }
}