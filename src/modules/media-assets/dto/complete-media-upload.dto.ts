import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CompleteMediaUploadDto {
  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @IsString()
  @IsNotEmpty()
  originalFileName: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  imageDuration?: number;
}