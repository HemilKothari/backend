import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateRickshawDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerPhone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  vehicleType?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsDateString()
  pucExpiry?: string;

  @IsOptional()
  @IsDateString()
  permitExpiry?: string;
}