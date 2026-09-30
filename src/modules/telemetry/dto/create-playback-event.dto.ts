import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlaybackEventDto {
  @IsString()
  campaignId!: string;

  @IsOptional()
  @IsString()
  playlistId?: string;

  @IsOptional()
  @IsString()
  playlistItemId?: string;

  @IsDateString()
  playedAt!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
