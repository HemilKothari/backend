import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { DriverDocumentType } from '@prisma/client';

import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDocumentDto {
  @ApiProperty({
    example: 'PUC',
    enum: DriverDocumentType,
  })
  @IsEnum(DriverDocumentType)
  documentType!: DriverDocumentType;

  @ApiProperty({
    example: 'puc.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiProperty({
    example: '2027-06-26',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}