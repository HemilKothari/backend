import {
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

import { Type } from 'class-transformer';

import { SummaryPeriod } from '../enums/summary-period.enum';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetSummaryDto {
  @ApiProperty({
    enum: SummaryPeriod,
    example: SummaryPeriod.DAILY,
  })
  @IsEnum(SummaryPeriod)
  period: SummaryPeriod;

  @ApiPropertyOptional({
    example: '2026-06-25',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: 6,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({
    example: 2026,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    example: 2,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  quarter?: number;

  @ApiPropertyOptional({
    example: '2026-06-22',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-06-29',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
