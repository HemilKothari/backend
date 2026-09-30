import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class HeartbeatDto {
  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  playerVersion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  uptimeSeconds?: number;
}