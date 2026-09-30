import { ApiProperty } from '@nestjs/swagger';

export class SyncResponseDto {
  @ApiProperty()
  syncRequired: boolean;

  @ApiProperty({ nullable: true })
  manifestVersion: string | null;

  @ApiProperty({ nullable: true })
  lastPublishedAt: Date | null;

  @ApiProperty()
  syncIntervalSeconds: number;

  @ApiProperty()
  heartbeatIntervalSeconds: number;

  @ApiProperty()
  telemetryIntervalSeconds: number;

  @ApiProperty()
  downloadRetryIntervalSeconds: number;

  @ApiProperty()
  serverTime: Date;

  @ApiProperty({ nullable: true })
  reason?: string;
}