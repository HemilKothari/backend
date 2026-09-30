// create-campaign.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({
    example: 'ABC Campaign',
  })
  @IsString()
  @IsNotEmpty()
  campaignName!: string;

  @ApiProperty({
    example: 'adv_123456',
  })
  @IsString()
  @IsNotEmpty()
  advertiserId!: string;

  @ApiProperty({
    example: 30,
  })
  @Min(1)
  @IsInt()
  durationDays!: number;

  @ApiProperty({
    example: 5,
  })
  @IsInt()
  @Min(1)
  frequencyPerLoop!: number;

  @ApiProperty({
    example: 1000,
  })
  @IsInt()
  @Min(1)
  fleetSize!: number;

  @ApiProperty({
    description: 'Uploaded Media Asset ID',
  })
  @IsUUID()
  mediaAssetId: string;

  @ApiProperty({
    example: 3,
  })
  @IsInt()
  @Min(0)
  creativeChangesAllowed!: number;
}
