import { IsEnum, IsOptional } from 'class-validator';

export enum ReportPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  LIFETIME = 'lifetime',
}

export class ReportPeriodDto {
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;
}