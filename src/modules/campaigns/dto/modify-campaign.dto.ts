import {
  IsDateString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class ModifyCampaignDto {
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  fleetSize?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyPerLoop?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;
}