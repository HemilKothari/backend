import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class UpdateAdvertiserDto {
  @IsString()
  companyName?: string;

  @IsString()
  contactName?: string;
}