import {
  ValidateNested,
  IsArray,
  IsString,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CreateTelemetryDto } from './create-telemetry.dto';

export class CreateTelemetryBatchDto {
  @IsString()
  deviceCode!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTelemetryDto)
  logs!: CreateTelemetryDto[];
}