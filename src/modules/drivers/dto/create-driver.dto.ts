import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDriverDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @IsOptional()
  @IsDateString()
  licenceExpiry?: string;
}