import {
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class InitiateMediaUploadDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsOptional()
  @IsUUID()
  advertiserId?: string;
}