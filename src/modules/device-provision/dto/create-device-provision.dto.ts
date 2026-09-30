import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDeviceProvisionDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  simNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  hardwareSerial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  installerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}