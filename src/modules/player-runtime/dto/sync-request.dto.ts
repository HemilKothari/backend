import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SyncRequestDto {
  @ApiPropertyOptional({
    description: 'Current manifest version cached on the device',
  })
  @IsOptional()
  @IsString()
  currentManifestVersion?: string;
}