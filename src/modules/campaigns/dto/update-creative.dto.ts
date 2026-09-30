import { IsInt, IsString, Max, Min } from 'class-validator';

export class UpdateCreativeDto {
  @IsString()
  mediaAssetId!: string;

  @IsInt()
  @Min(10)
  @Max(60)
  imageDurationSeconds?: number;
}