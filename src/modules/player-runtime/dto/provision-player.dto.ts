
import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ProvisionPlayerDto {
  @IsString()
  @MaxLength(128)
  provisioningToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  simNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  hardwareSerial?: string;
}
