import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTelemetryDto {

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsString()
  playlistVersion?: string;

  @IsOptional()
  @IsString()
  currentlyPlaying?: string;

  @IsOptional()
  @IsNumber()
  batteryLevel?: number;

  @IsOptional()
  @IsNumber()
  networkStrength?: number;

  @IsBoolean()
  isOnline!: boolean;

  @IsString()
  timestamp!: string;
}