import { IsString, MaxLength } from 'class-validator';

export class ProvisionPlayerDto {
  @IsString()
  @MaxLength(128)
  provisioningToken: string;
}