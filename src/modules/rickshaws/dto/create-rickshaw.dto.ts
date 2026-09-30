import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRickshawDto {
  @IsString()
  @IsNotEmpty()
  registrationNumber!: string;

  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsString()
  @IsNotEmpty()
  ownerPhone!: string;

  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsString()
  @IsNotEmpty()
  driverId!: string;

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