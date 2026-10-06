import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class UpdateAdvertiserDto {
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @IsString()
  @IsNotEmpty()
  contactName?: string;
}