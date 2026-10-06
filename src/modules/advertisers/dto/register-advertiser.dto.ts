import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class RegisterAdvertiserDto {
  @ApiProperty({
    example: 'AdOnTheGo',
  })
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @ApiProperty({
    example: 'Hemil Kothari',
  })
  @IsString()
  @IsNotEmpty()
  contactName!: string;
}