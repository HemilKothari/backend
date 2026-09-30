import { IsNotEmpty, IsString } from 'class-validator';

export class ManifestAckDto {
  @IsString()
  @IsNotEmpty()
  manifestVersion!: string;
}