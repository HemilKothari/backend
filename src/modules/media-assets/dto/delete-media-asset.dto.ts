import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteMediaAssetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}