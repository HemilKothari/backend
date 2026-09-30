import {
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CreatePlaybackEventDto } from './create-playback-event.dto';
import { CreateTelemetryDto } from './create-telemetry.dto';

export class CreateSyncDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTelemetryDto)
  telemetryLogs?: CreateTelemetryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlaybackEventDto)
  playbackEvents?: CreatePlaybackEventDto[];
}