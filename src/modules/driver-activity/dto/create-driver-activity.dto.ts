import {
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateDriverActivityDto {
  @IsUUID()
  @IsNotEmpty()
  rickshawId!: string;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  endTime!: string;
}