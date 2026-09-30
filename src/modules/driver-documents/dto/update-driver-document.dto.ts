import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDriverDocumentDto {
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}